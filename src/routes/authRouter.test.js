const request = require('supertest');
const app = require('../service');


let adminUser, testUser, adminUserAuthToken,testUserAuthToken;

const h = require('../testHelpers.test');


describe('User Authentication', () => {
  beforeAll(async () => {
    testUser = h.generateRandomUser()    
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;    
    expect(registerRes.status).toBe(200);
    h.expectValidJwt(testUserAuthToken);

  });

  test('login/logout', async () => {
    // good login
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    h.expectValidJwt(loginRes.body.token)

    const expectedUser = { ...testUser, roles: [{ role: 'diner' }] };
    delete expectedUser.password;
    expect(loginRes.body.user).toMatchObject(expectedUser);

    const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`)  // Set the token in the header
    expect(logoutRes.status).toBe(200);


  });


  test('bad email login', async () => {
    const badEmailUser = deepCopy(testUser)
    badEmailUser.email = "bad_@test.com"
    const loginRes2 = await request(app).put('/api/auth').send(badEmailUser);
    expect(loginRes2.status).toBe(404);
  });
  
  test('bad password login', async () => {  
    const badPasswordUser = deepCopy(testUser)
    badPasswordUser.password = "bad_pass"
    const loginRes3 = await request(app).put('/api/auth').send(badPasswordUser);
    expect(loginRes3.status).toBe(404);
  });

  test('bad registration - no password', async () => {
    const badRegistrationUser = deepCopy(testUser)
    delete badRegistrationUser.password;

    const registerRes = await request(app).post('/api/auth').send(badRegistrationUser);
    expect(registerRes.status).toBe(400);
  });

});

describe('Normal attempting admin actions', () => {  
  beforeAll(async () => {
    adminUser = await h.createAdminUser()
    testUser = h.generateRandomUser()    
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    h.expectValidJwt(testUserAuthToken);
    
  });
  test('updateUser normal on admin', async () => {
    adminUser.password = "Some other password"

    
    const updateUserRes = await request(app)
      .put(`/api/auth/${adminUser.id}`)
      .send(adminUser)
      .set('Authorization', `Bearer ${testUserAuthToken}`)
    
    
    
    expect(updateUserRes.status).toBe(403);
    
  });
  // test('updateUser normal on self', async () => {
  //   const loginRes = await request(app).put('/api/auth').send(testUser);
  //   expect(loginRes.status).toBe(200);
  //   h.expectValidJwt(loginRes.body.token)


  //   testUser.password = "Some other password"

    
  //   const updateUserRes = await request(app)
  //     .put(`/api/auth/${testUser.id}`)
  //     .send(testUser)
  //     .set('Authorization', `Bearer ${testUserAuthToken}`)

  //   expect(updateUserRes.status).toBe(200);    
  // });
})

describe('Admin User Actions', () => {
  beforeAll(async () => {
    testUser = await h.createUser()
    adminUser = await h.createAdminUser()
    const loginRes = await request(app).put('/api/auth').send(adminUser);
    expect(loginRes.status).toBe(200);
    adminUserAuthToken = loginRes.body.token;
    
    h.expectValidJwt(adminUserAuthToken);
  });


  test('updateUser admin on other', async () => {
    testUser.password = "Some other password"

    
    const updateUserRes = await request(app)
      .put(`/api/auth/${testUser.id}`)
      .send(testUser)
      .set('Authorization', `Bearer ${adminUserAuthToken}`)

    // expect(updateUserRes.status).toBe(200);
    
  });
  test('updateUser no email/password', async () => {    
    const updateUserRes = await request(app)
      .put(`/api/auth/${testUser.id}`)
      .send({email:null, password:null})
      .set('Authorization', `Bearer ${adminUserAuthToken}`)

    // expect(updateUserRes.status).toBe(404);
    
  });
  test('updateUser bad token on other', async () => {
    testUser.password = "Some other password"

    
    const updateUserRes = await request(app)
      .put(`/api/auth/${testUser.id}`)
      .send(testUser)
      .set('Authorization', `Bearer not-a-token`)

    // expect(updateUserRes.status).toBe(401);
    
  });
  

  

});

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

