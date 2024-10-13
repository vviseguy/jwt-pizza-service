const { DB, Role } = require("../database/database");
const h = require("../testHelpers.test");

let testUser;
describe("Misc", () => {
  test("Bad Franchisee creation", async () => {
    testUser = h.generateRandomUser();
    testUser.roles = [{ role: Role.Franchisee }];

    await expect(async () => await DB.addUser(testUser)).rejects.toThrow(Error);
  });
  test("Get bad Id", async () => {
    const connection = await DB.getConnection();
    try {
      await expect(async () => {
        await DB.getID(connection, "name", h.randomId(), "franchise");
      }).rejects.toThrow(Error);
    } finally {
      connection.end();
    }
  });
});
