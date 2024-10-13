const request = require("supertest");
const app = require("../service");

const h = require("../testHelpers.test.js");


let admin, adminUserAuthToken;
describe("Franchise endpoint tests", () => {
  beforeAll(async () => {
    admin = await h.createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(admin);
    adminUserAuthToken = loginRes.body.token;
    h.expectValidJwt(adminUserAuthToken);
  });

  test("List all the franchises", async () => {
    let franchiseRes = await request(app).get("/api/franchise");
    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body).toEqual(expect.any(Array));

    let items = [
      expect.objectContaining({ id: (await h.createFranchise(admin)).id }),
      expect.objectContaining({ id: (await h.createFranchise(admin)).id }),
      expect.objectContaining({ id: (await h.createFranchise(admin)).id }),
    ];

    franchiseRes = await request(app).get("/api/franchise");
    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body).toEqual(expect.arrayContaining(items));
  });

  test("List all the franchises as admin ", async () => {
    let franchiseRes = await request(app).get("/api/franchise")
      .set("Authorization", `Bearer ${adminUserAuthToken}`);
    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body).toEqual(expect.any(Array));

    let items = [
      expect.objectContaining({ id: (await h.createFranchise(admin)).id }),
      expect.objectContaining({ id: (await h.createFranchise(admin)).id }),
      expect.objectContaining({ id: (await h.createFranchise(admin)).id }),
    ];

    franchiseRes = await request(app).get("/api/franchise");
    expect(franchiseRes.status).toBe(200);
    expect(franchiseRes.body).toEqual(expect.arrayContaining(items));
  });


 
  test("Create Franchise without admin", async () => {
    const nonAdmin = await h.createUser();
    const loginRes = await request(app).put('/api/auth').send(nonAdmin);
    const nonadminUserAuthToken = loginRes.body.token;
    h.expectValidJwt(nonadminUserAuthToken);
    
    let {email, name, id} = nonAdmin
    const franchise = h.generateRandomFranchise({email, name, id} );
    let createRes = await request(app).post("/api/franchise")
      .send(franchise)
      .set("Authorization", `Bearer ${nonadminUserAuthToken}`);

    expect(createRes.status).toBe(403);

  });
  test("Create Franchise with bad email", async () => {
    let {name, id} = admin
    let email = "wrong@email"
    const franchise = h.generateRandomFranchise({email, name, id} );
    let createRes = await request(app).post("/api/franchise")
      .send(franchise)
      .set("Authorization", `Bearer ${adminUserAuthToken}`);

    expect(createRes.status).toBe(404);

  });
  test("Create Franchise", async () => {
    let {email, name, id} = admin
    const franchise = h.generateRandomFranchise({email, name, id} );
    let createRes = await request(app).post("/api/franchise")
      .send(franchise)
      .set("Authorization", `Bearer ${adminUserAuthToken}`);

    expect(createRes.status).toBe(200);

    franchise.id = expect.any(Number)
    expect(createRes.body).toEqual(franchise);
  });
  test("Get franchises by user", async () => {

    // add a franchise
    let {email, name, id} = admin
    const franchise = await h.createFranchise( {email, name, id})

    // get by user
    const getRes = await request(app).get(`/api/franchise/${admin.id}`)
      .set("Authorization", `Bearer ${adminUserAuthToken}`);
    
    expect(getRes.status).toBe(200);
    franchise.stores = expect.any(Array)
    expect(getRes.body).toEqual(expect.arrayContaining([franchise]));
  });
  test("Get empty franchises by user", async () => {
    const admin2 = await h.createAdminUser();
    const loginRes = await request(app).put('/api/auth').send(admin2);
    const admin2AuthToken = loginRes.body.token;
    h.expectValidJwt(admin2AuthToken);

    // test for empty franchises
    let getRes = await request(app).get(`/api/franchise/${admin2.id}`)
      .set("Authorization", `Bearer ${admin2AuthToken}`);
    
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual([]);
  });
  test("Delete Store without franchise and no admin", async () => {
    
    let testUser = h.generateRandomUser()    
    const registerRes = await request(app).post('/api/auth').send(testUser);
    let testUserAuthToken = registerRes.body.token;   

    let deleteStoreRes = await request(app).delete(`/api/franchise/${h.randomId()}/store/${h.randomId()}`)
      .set("Authorization", `Bearer ${testUserAuthToken}`);
    expect(deleteStoreRes.status).toBe(403);
  })
  test("Create Store without franchise and no admin", async () => {    
    let testUser = h.generateRandomUser()    
    const registerRes = await request(app).post('/api/auth').send(testUser);
    let testUserAuthToken = registerRes.body.token;   

    let {email, name, id} = admin
    const franchise = await h.createFranchise( {email, name, id})
    const store = h.generateRandomStore(franchise)
    let addStoreRes = await request(app).post(`/api/franchise/${h.randomId()}/store`)
      .send(store)
      .set("Authorization", `Bearer ${testUserAuthToken}`)
    expect(addStoreRes.status).toBe(403);
  })
  test("Add/delete store to franchise non admin", async () => {
    let testUser = await h.createUser()  
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    let testUserAuthToken = loginRes.body.token
    h.expectValidJwt(loginRes.body.token)   
    
    
    let {email, name, id} = testUser
    const franchise = await h.createFranchise( {email, name, id})

    // Add store
    const store = h.generateRandomStore(franchise)
    let addStoreRes = await request(app).post(`/api/franchise/${franchise.id}/store`)
      .send(store)
      .set("Authorization", `Bearer ${testUserAuthToken}`)
    expect(addStoreRes.status).toBe(200);
    
    store.id = expect.any(Number)
    expect(addStoreRes.body).toEqual(store);

    // check that store was added
    let getRes = await request(app).get(`/api/franchise/${testUser.id}`)
      .set("Authorization", `Bearer ${testUserAuthToken}`);
    expect(getRes.status).toBe(200);
    
    delete store.franchiseId;
    store.totalRevenue = 0

    franchise.stores = [store]
    expect(getRes.body).toEqual(expect.arrayContaining([franchise]));

    // remove store
    let deleteStoreRes = await request(app).delete(`/api/franchise/${franchise.id}/store/${store.id}`)
      .set("Authorization", `Bearer ${testUserAuthToken}`);
    expect(deleteStoreRes.status).toBe(200);

  });
  test("Remove franchise", async () => {
    let {email, name, id} = admin
    const franchise = await h.createFranchise( {email, name, id})


    // remove store
    let deleteStoreRes = await request(app).delete(`/api/franchise/${franchise.id}`)
      .set("Authorization", `Bearer ${adminUserAuthToken}`);
    expect(deleteStoreRes.status).toBe(200);

    // Check that store was removed
    let getRes = await request(app).get(`/api/franchise/${admin.id}`)
      .set("Authorization", `Bearer ${adminUserAuthToken}`);
    expect(getRes.status).toBe(200);

    expect(getRes.body).not.toEqual(expect.arrayContaining([franchise]));
  });
  // test("Remove non existant franchise", async () => {
    
  //   // remove store
  //   let deleteStoreRes = await request(app).delete(`/api/franchise/${h.randomId()}`)
  //     .set("Authorization", `Bearer ${adminUserAuthToken}`);
  //   expect(deleteStoreRes.status).toBe(403);

  // });
  test("Remove existant franchise not as admin", async () => {
    let user = await h.createUser();
    const loginRes = await request(app).put('/api/auth').send(user);
    let userAuthToken = loginRes.body.token;
    h.expectValidJwt(userAuthToken);

    let {email, name, id} = admin
    const franchise = await h.createFranchise( {email, name, id})

    // remove store
    let deleteStoreRes = await request(app).delete(`/api/franchise/${franchise.id}`)
      .set("Authorization", `Bearer ${userAuthToken}`);
    expect(deleteStoreRes.status).toBe(403);

  });

});
