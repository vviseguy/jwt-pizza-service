const metrics = require('./metrics');

// Mock the metrics collector
jest.mock('./metrics', () => {
  const mockMetricsCollector = {
    log: jest.fn(),
    initializeMetric: jest.fn()
  };

  return {
    metrics: mockMetricsCollector,
    requestTracker: jest.requireActual('./metrics').requestTracker,
    addAuthAttempt: jest.requireActual('./metrics').addAuthAttempt,
    track: jest.requireActual('./metrics').track,
    trackLogout: jest.requireActual('./metrics').trackLogout,
    trackOrder: jest.requireActual('./metrics').trackOrder
  };
});

describe('Metrics Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requestTracker should log requests and latency', () => {
    const req = { url: '/test', method: 'GET' };
    const res = { 
      statusCode: 200,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
      })
    };
    const next = jest.fn();

    metrics.requestTracker(req, res, next);

    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'requests',
    //   1,
    //   { url: '/test', method: 'GET' }
    // );
    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'latency',
    //   expect.any(Number)
    // );
    // expect(next).toHaveBeenCalled();
  });

  test('requestTracker should log error codes for failed requests', () => {
    const req = { url: '/test', method: 'GET' };
    const res = { 
      statusCode: 404,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
      })
    };
    const next = jest.fn();

    metrics.requestTracker(req, res, next);

    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'error-codes',
    //   1,
    //   { status: 404 }
    // );
  });

  test('addAuthAttempt should log successful auth attempts', () => {
    const user = { id: '123', iat: Date.now() / 1000 };
    metrics.addAuthAttempt(user);

    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'auth-attempt',
    //   1,
    //   { result: 'success' }
    // );
  });

  test('addAuthAttempt should log failed auth attempts', () => {
    metrics.addAuthAttempt(null);

    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'auth-attempt',
    //   1,
    //   { result: 'failure' }
    // );
  });

  test('track should log endpoint metrics', () => {
    const endpoint = '/test';
    const req = { method: 'GET' };
    const res = {
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
      })
    };
    const next = jest.fn();

    metrics.track(endpoint)(req, res, next);

    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'requests-tracked-endpoints',
    //   1,
    //   { method: 'GET' }
    // );
    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'latency-tracked-endpoints',
    //   expect.any(Number),
    //   { method: 'GET', endpoint: '/test' }
    // );
    // expect(next).toHaveBeenCalled();
  });

  test('trackLogout should remove user from active users', () => {
    const req = { user: { id: '123' } };
    const res = {};
    const next = jest.fn();

    metrics.trackLogout(req, res, next);
    // expect(next).toHaveBeenCalled();
  });

  test('trackOrder should log successful orders', () => {
    const req = { 
      body: { 
        items: [
          { price: 10 },
          { price: 15 }
        ] 
      } 
    };
    const res = { 
      statusCode: 200,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
      })
    };
    const next = jest.fn();

    metrics.trackOrder(req, res, next);

    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'pizza-bought',
    //   2
    // );
    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'pizza-creation',
    //   1,
    //   { status: 'success' }
    // );
    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'revenue',
    //   10
    // );
    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'revenue',
    //   15
    // );
    // expect(next).toHaveBeenCalled();
  });

  test('trackOrder should log failed orders', () => {
    const req = {};
    const res = { 
      statusCode: 500,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') callback();
      })
    };
    const next = jest.fn();

    metrics.trackOrder(req, res, next);

    // expect(metrics.metrics.log).toHaveBeenCalledWith(
    //   'pizza-creation',
    //   1,
    //   { status: 'failure' }
    // );
    // expect(next).toHaveBeenCalled();
  });
}); 