const config = require("./config");
const fs = require("fs");

let activeUsers = {};

// Helper to convert attributes object into OTEL attribute array
const convertAttributes = (attrs) =>
  Object.entries(attrs).map(([key, value]) => ({
    key,
    value: { stringValue: "" + value },
  }));

// Helper to prepare a data point for export (timestamp is already in nanoseconds)
const prepareDataPoint = (dp) => ({
  asDouble: dp.value,
  timeUnixNano: dp.timeUnixNano,
  attributes: convertAttributes(dp.attributes),
});

// Mapping of metric types to export functions
const exportMetricByType = {
  counter: (dataPoints) => ({
    counter: { dataPoints: dataPoints.map(prepareDataPoint) },
  }),
  gauge: (dataPoints) => ({
    gauge: { dataPoints: dataPoints.map(prepareDataPoint) },
  }),
  histogram: (dataPoints) => ({
    histogram: {
      dataPoints: dataPoints.map((dp) => ({
        ...prepareDataPoint(dp),
        count: 1,
        sum: dp.value,
      })),
    },
  }),
};

class MetricsCollector {
  constructor(defaultAttributes = {}) {
    this.buffer = {}; // Holds metric definitions and data points
    this.defaultAttributes = defaultAttributes; // Default attributes applied to every log entry
  }

  /**
   * Initialize a metric.
   * @param {string} name - Metric name.
   * @param {string} type - Metric type ("counter", "gauge", "histogram").
   * @param {string} unit - Measurement unit (e.g., "requests", "ms").
   * @param {object} extraFields - Additional config fields (e.g., isMonotonic, aggregationTemporality).
   */
  initializeMetric(name, type = "counter", unit = "1", extraFields = {}) {
    if (!this.buffer[name]) {
      this.buffer[name] = {
        type,
        unit,
        dataPoints: [],
        extra: { ...extraFields },
      };
    }
  }

  /**
   * Record a data point.
   * @param {string} name - Metric name.
   * @param {number} value - Value to record.
   * @param {object} attributes - Attributes to attach (merged with defaults).
   */
  log(name, value = 1, attributes = {}) {
    if (this.buffer[name]) {
      // Get current time in nanoseconds
      const timeUnixNano = Date.now() * 1000000;
      // Merge default and provided attributes
      const mergedAttributes = { ...this.defaultAttributes, ...attributes };
      const dataPoint = { value, timeUnixNano, attributes: mergedAttributes };
      this.buffer[name].dataPoints.push(dataPoint);
    } else {
      console.log(`Uninitialized metric: ${name}`);
    }
  }

  /**
   * Extract all metrics and then reset their data points.
   */
  popMetrics() {
    const metricsToReturn = Object.entries(this.buffer).map(
      ([name, metric]) => ({
        name,
        unit: metric.unit,
        type: metric.type,
        dataPoints: metric.dataPoints.slice(), // shallow copy
        extra: metric.extra,
      })
    );
    // Reset each metric's dataPoints array.
    Object.keys(this.buffer).forEach((name) => {
      this.buffer[name].dataPoints = [];
    });
    return metricsToReturn;
  }

  /**
   * Export all metrics in a single OTEL-compliant JSON object.
   */
  exportMetrics() {
    const metrics = this.popMetrics();

    // Convert each metric into an OTEL metric entry.
    const otelMetrics = metrics
      .filter((metric) => metric.dataPoints.length > 0)
      .map((metric) => {
        const typeExport =
          exportMetricByType[metric.type] || exportMetricByType.gauge;
        return {
          name: metric.name,
          unit: metric.unit,
          ...typeExport(metric.dataPoints),
          ...metric.extra, // Spread any extra fields
        };
      });

    // Group all metrics into one resourceMetrics structure.
    return {
      resourceMetrics: [
        {
          scopeMetrics: [
            {
              metrics: otelMetrics,
            },
          ],
        },
      ],
    };
  }
}

const metrics = new MetricsCollector({ source: config.metrics.source });

// initilize metrics

metrics.initializeMetric("auth-attempt", "summary", "1");

// functionality to log metrics
function addAuthAttempt(user) {
  // log the expiration of the users tokens
  // console.log(user)

  if (user) {
    metrics.log("auth-attempt", 1, { result: "success" });
    activeUsers[user.id] = user.iat;
    // console.log(activeUsers)
  } else metrics.log("auth-attempt", 1, { result: "failure" });
}


metrics.initializeMetric("error-codes", "summary", "1");
metrics.initializeMetric("requests", "summary", "1");
metrics.initializeMetric("requests-tracked-endpoints", "summary", "1");
metrics.initializeMetric("latency", "summary", "ms");
metrics.initializeMetric("latency-tracked-endpoints", "summary", "ms");

// Express middleware
const requestTracker = (req, res, next) => {
  metrics.log("requests", 1, { url: req.url, method: req.method });

  let start = Date.now();
  res.on("finish", () => {
    if (res.statusCode >= 400)
      metrics.log("error-codes", 1, { status: res.statusCode });
    // When the response finishes
    const duration = Date.now() - start; // Calculate the time taken
    metrics.log("latency", duration, { url: req.url, method: req.method });
  });
  next();
};

function track(endpoint) {
  return (req, res, next) => {
    metrics.log("requests-tracked-endpoints", 1, { method: req.method });

    let start = Date.now();
    res.on("finish", function () {
      const latency = Date.now() - start;
      metrics.log("latency-tracked-endpoints", latency, {
        method: req.method,
        endpoint,
      });
    });
    next();
  };
}

const trackLogout = (req, res, next) => {
  // track active users
  const user = req.user;
  // console.log(activeUsers)
  if (user) delete activeUsers[user.id];

  next();
};

metrics.initializeMetric("pizza-bought", "gauge", "1");
metrics.initializeMetric("revenue", "gauge", "1");
metrics.initializeMetric("pizza-creation", "summary", "1");
const trackOrder = (req, res, next) => {
  console.log("orderItems", res.status, res.statusCode);
  res.on("finish", function () {
    console.log("orderItemsadfasdfa", res.statusCode);
    if (res.statusCode == 200) {
      // console.log(req.body)
      const orderItems = req.body.items;
      // console.log("orderItems",orderItems.length)
      metrics.log("pizza-bought", orderItems.length);
      metrics.log("pizza-creation", 1, { status: "success" });
      orderItems.forEach((orderItem) => {
        metrics.log("revenue", orderItem.price);
      });
    } else if (res.statusCode >= 400) {
      metrics.log("pizza-creation", 1, { status: "failure" });
    }
  });
  next();
};

// Log System Metrics
const os = require("os");

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  const percent = cpuUsage.toFixed(2) * 100;

  return percent;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

metrics.initializeMetric("cpu", "gauge", "%");
metrics.initializeMetric("memory", "gauge", "%");
metrics.initializeMetric("active-users", "gauge", "1");

function recordGaugeMetrics() {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  activeUsers = Object.fromEntries(
    Object.entries(activeUsers).filter(
      ([, exp_time]) => exp_time <= currentTime
    )
  );

  metrics.log("cpu", getCpuUsagePercentage());
  metrics.log("memory", getMemoryUsagePercentage());
  metrics.log("active-users", Object.keys(activeUsers).length);
}

function sendMetricsToGrafana() {
  recordGaugeMetrics();

  const metricData = metrics.exportMetrics();
  // console.dir(metricData, { depth: null });
  fs.writeFileSync("output.txt", JSON.stringify(metricData, null, 2));

  fetch(`${config.metrics.url}`, {
    method: "POST",
    body: JSON.stringify(metricData),
    headers: {
      Authorization: `Bearer ${config.metrics.apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok)
        console.error("Failed to push metrics data to Grafana", response);
      // else console.log("Pushed all metrics");
    })
    .catch((error) => {
      logger.logUnhandledError(error);
      console.error("Error pushing metrics:", error);
    });
}

setInterval(recordGaugeMetrics, 1000);
setInterval(sendMetricsToGrafana, 10000);

module.exports = {
  requestTracker,
  addAuthAttempt,
  track,
  trackLogout,
  trackOrder,
  metrics,
};
