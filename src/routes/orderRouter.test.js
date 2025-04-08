const request = require("supertest");
const app = require("../service");

const h = require("../testHelpers.test");


let admin, adminAuthToken;
describe("Endpoint Tests", () => {
  beforeAll(async () => {
    admin = await h.createAdminUser();
    const loginRes = await request(app).put("/api/auth").send(admin);
    adminAuthToken = loginRes.body.token;
    h.expectValidJwt(adminAuthToken);
  });

  test("Get the pizza menu", async () => {
    let menuRes = await request(app).get("/api/order/menu");
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toEqual(expect.any(Array));

    let items = [
      await h.createMenuItem(),
      await h.createMenuItem(),
      await h.createMenuItem(),
    ];

    menuRes = await request(app).get("/api/order/menu");
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toEqual(expect.arrayContaining(items));
  });
  test("Add menu item", async () => {
    const menuItem = h.generateMenuItem()
    let addMenuRes = await request(app).put("/api/order/menu")
      .set("Authorization", `Bearer ${adminAuthToken}`)
      .send(menuItem)
    expect(addMenuRes.status).toBe(200);

    menuItem.id = expect.any(Number)
    let menuRes = await request(app).get("/api/order/menu");
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toEqual(expect.arrayContaining([menuItem]));
  });
  test("Add menu item unauthorized", async () => {
    const regUser = await h.createUser();
    const loginRes = await request(app).put('/api/auth').send(regUser);
    let regUserAuthToken = loginRes.body.token;
    
    const menuItem = h.generateMenuItem()
    let addMenuRes = await request(app).put("/api/order/menu")
      .set("Authorization", `Bearer ${regUserAuthToken}`)
      .send(menuItem)
    expect(addMenuRes.status).toBe(403);

    menuItem.id = expect.any(Number)
    let menuRes = await request(app).get("/api/order/menu");
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).not.toEqual(expect.arrayContaining([menuItem]));
  });

  test("Get menu items", async () => {
    let menuRes = await request(app).get("/api/order/menu");
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toEqual(expect.any(Array));

    let items = [
      await h.createMenuItem(),
      await h.createMenuItem(),
      await h.createMenuItem(),
    ];

    menuRes = await request(app).get("/api/order/menu");
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toEqual(expect.arrayContaining(items));
  });
  test("Get orders", async () => {
    let menuRes = await request(app)
      .get("/api/order")
      .set("Authorization", `Bearer ${adminAuthToken}`);
    expect(menuRes.status).toBe(200);

    let expectObj = {
      dinerId: expect.any(Number),
      orders: expect.any(Array),
      page: expect.any(Number),
    };
    expect(menuRes.body).toEqual(expectObj);
  });
  test("Create order", async () => {
    const franchise = await h.createFranchise();
    const store = await h.createStore(franchise);
    
    // make sure the menu has items
    await h.createMenuItem();
    await h.createMenuItem();
    await h.createMenuItem();
    
    let order = await h.generateRandomOrder(store);
    let createOrderRes = await request(app)
      .post("/api/order")
      .set("Authorization", `Bearer ${adminAuthToken}`)
      .send(order);
    expect(createOrderRes.status).toBe(200);

    order.id = expect.any(Number)
    let expectObj = {
      order: order,
      jwt: expect.any(String),
    };
    expect(createOrderRes.body).toEqual(expectObj);
    order = createOrderRes.body.order
    order.date = expect.any(String)
    order.items.forEach(element => {
      element.id = expect.any(Number)
    });

    // check that the order exists on the user
    let menuRes = await request(app)
      .get("/api/order")
      .set("Authorization", `Bearer ${adminAuthToken}`);
    expect(menuRes.status).toBe(200);

    expectObj = {
      dinerId: expect.any(Number),
      orders: expect.arrayContaining([order]),
      page: expect.any(Number),
    };
    expect(menuRes.body).toEqual(expectObj);
  });
  test("Create bad order", async () => {
    const franchise = await h.createFranchise();
    const store = await h.createStore(franchise);
    
    // make sure the menu has items
    await h.createMenuItem();
    await h.createMenuItem();
    await h.createMenuItem();

    const order = await h.generateRandomOrder(store);
    
    delete order.storeId //= h.randomId() // get order from invalid store

    let createOrderRes = await request(app)
      .post("/api/order")
      .set("Authorization", `Bearer ${adminAuthToken}`)
      .send(order);

    expect(createOrderRes.status).toBe(500);

  });
  test("Get the pizza menu", async () => {
    let menuRes = await request(app).get("/api/order/menu");
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toEqual(expect.any(Array));

    let items = [
      await h.createMenuItem(),
      await h.createMenuItem(),
      await h.createMenuItem(),
    ];

    menuRes = await request(app).get("/api/order/menu");
    expect(menuRes.status).toBe(200);
    expect(menuRes.body).toEqual(expect.arrayContaining(items));
  });
});
