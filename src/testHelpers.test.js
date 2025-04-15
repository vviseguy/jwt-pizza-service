const { DB, Role } = require("./database/database");

function generateRandomUser() {
  return {
    name: randomName(),
    email: randomName() + "@mytest.eu",
    password: randomName(),
    roles: [],
  };
}
function generateRandomFranchise(...admins) {
  return { admins: admins, name: randomName() };
}
function generateRandomStore(franchise) {
  return { franchiseId: franchise.id, name: randomName() };
}
function generateMenuItem() {
  return {
    title: randomName(),
    description: randomName(),
    image: randomName(),
    price: randomPrice(),
  };
}
async function generateRandomOrder(store, n = 3) {
  function selectRandomMenuItems(menu, n){
    return getRandomItems(menu.map((obj) => ({menuId:obj.id, description:obj.description, price:obj.price})), n)
  }
  await DB.getConnection();
  const menu = await DB.getMenu();
  return {
    franchiseId: store.franchiseId,
    storeId: store.id,
    items: selectRandomMenuItems(menu, n),
  };
}
async function createUser() {
  let user = generateRandomUser();
  await DB.getConnection();
  return { ...(await DB.addUser(user)), ...user };
}
async function createAdminUser() {
  let user = generateRandomUser();
  user.roles = [{ role: Role.Admin }];

  await DB.getConnection();
  return { ...(await DB.addUser(user)), ...user };
}
async function createMenuItem() {
  const item = generateMenuItem();
  await DB.getConnection();
  return await DB.addMenuItem(item);
}
async function createOrder(user, store) {
  let order = generateRandomOrder(store);
  await DB.getConnection();
  return await DB.addDinerOrder(user, order);
}
async function createFranchise(...admins) {
  let franchise = generateRandomFranchise(...admins);

  await DB.getConnection();
  return await DB.createFranchise(franchise);
}
async function createStore(franchise) {
  let store = generateRandomStore(franchise);

  await DB.getConnection();
  return await DB.createStore(store.franchiseId, store);
}
function randomName() {
  return Math.random().toString(36).substring(2, 12);
}
function randomPrice() {
  return Math.round(Math.random() * 10000) / 100;
}
function randomId() {
  return Math.round(Math.random() * 1000000) + 5000;
}
function getRandomItems(arr, n) {
  const result = [];
  const usedIndices = new Set(); // To avoid duplicate selections

  while (result.length < n && result.length < arr.length) {
    const randomIndex = Math.floor(Math.random() * arr.length);

    if (!usedIndices.has(randomIndex)) {
      // Ensure unique selections
      result.push(arr[randomIndex]);
      usedIndices.add(randomIndex);
    }
  }

  return result;
}
function generateExpectsObjShadow(obj) {
  // if (obj == null || obj == undefined) return obj;
  let rtrn;
  switch (typeof obj) {
    case "array":
      rtrn = obj.map((item) => generateExpectsObjShadow(item));
      return expect.arrayContaining(rtrn);
    case "object":
      // Map object to new object
      rtrn = Object.entries(obj).reduce((acc, [key, value]) => {
        acc[key] = generateExpectsObjShadow(value);
        return acc;
      }, {});
      return expect.objectContaining(rtrn);
    case "date":
    case "string":
    case "number":
    case "boolean":
    default:
      return expect.any(obj);
  }
}
function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );
}

test("file loaded", async () => {
  expect(true).toBe(true);
});

// Export almost all the functions
module.exports = {
  generateRandomUser,
  generateRandomFranchise,
  generateRandomStore,
  generateMenuItem,
  generateRandomOrder,
  createUser,
  createAdminUser,
  createMenuItem,
  createOrder,
  createFranchise,
  createStore,
  randomName,
  randomPrice,
  randomId,
  getRandomItems,
  generateExpectsObjShadow,
  expectValidJwt,
};
