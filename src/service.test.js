const request = require('supertest');
const app = require('./service');

describe('Basic Service Endpoints', () => {
  test('GET /', async () => {
    const response = await request(app).get('/');
    
    // Expect the status to be 200 OK
    expect(response.status).toBe(200);
    
    // Check that the response body contains a message and version field that are strings
    expect(response.body).toEqual({
      message: expect.any(String), 
      version: expect.any(String), 
    });
  });

  test('GET /docs', async () => {
    const response = await request(app).get('/api/docs');
    
    // Expect the status to be 200 OK
    expect(response.status).toBe(200);
    
    // Check that the response body contains a message and version field that are strings
    expect(response.body).toEqual({
      version: expect.any(String),
      endpoints: expect.any(Array),
      config: { factory: expect.any(String)/*, db: expect.any(String) */},
    });
  });

  test('GET /unknown error endpoint should return 404', async () => {
    const response = await request(app).get('/unknown');
    
    // Expect the status to be 404
    expect(response.status).toBe(404);
  });

});