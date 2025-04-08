const metrics = require('./metrics');

describe('Metrics Module', () => {
  test('requestTracker should be a function', () => {
    expect(typeof metrics.requestTracker).toBe('function');
  });

  test('addAuthAttempt should be a function', () => {
    expect(typeof metrics.addAuthAttempt).toBe('function');
  });

  test('track should be a function', () => {
    expect(typeof metrics.track).toBe('function');
  });

  test('trackLogout should be a function', () => {
    expect(typeof metrics.trackLogout).toBe('function');
  });

  test('trackOrder should be a function', () => {
    expect(typeof metrics.trackOrder).toBe('function');
  });
}); 