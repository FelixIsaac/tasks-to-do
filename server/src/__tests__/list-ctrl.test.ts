import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
import { IUserDocument } from "../db/models/users";
import { loginUser, createUser, getUserByCookie } from "../controllers/user-ctrl";
import * as listCtrl from "../controllers/lists-ctrl";
import { IListDocument } from "../db/models/list";

describe("User model test", () => {
  // Additional time for downloading MongoDB binaries.
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

  let mongoServer: MongoMemoryServer;
  let cookie: string;
  let user: IUserDocument | null;
  let list: IListDocument;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    await mongoose.connect(await mongoServer.getUri(), {
      useNewUrlParser: true,
      useFindAndModify: true,
      haInterval: 5000,
      useUnifiedTopology: true,
      poolSize: 25,
      acceptableLatencyMS: 25,
      secondaryAcceptableLatencyMS: 100
    }, (err) => err && console.error(err));

    await createUser("Felix", "felix@felixisaac.dev", "strong p@ssW0rd");
    cookie = await loginUser("felix@felixisaac.dev", "strong p@ssW0rd", "234.23.12.2.4");
    user = await getUserByCookie(cookie, "234.23.12.2.4");
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop()
  });

  it("create list", async () => {
    try {
      const response = await listCtrl.createList(cookie, "234.23.12.2.4", "My Day", "Things I have to do today");
      const updatedUser = await getUserByCookie(cookie, "234.23.12.2.4");
      if (!updatedUser) fail("Updated user not found");

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Created list");
      expect(updatedUser.lists).toHaveLength(1);
    } catch (err) {
      fail(err);
    }

    try {
      await listCtrl.createList("invalid-cookie", "234.23.12.2.4", "Test list", "");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }
  });

  it("get list", async () => {
    try {
      const response = await listCtrl.getList(cookie, "234.23.12.2.4", list._id);

      list = response.data;
      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.data._id).toBeDefined();
    } catch (err) {
      fail(err);
    }

    try {
      await listCtrl.getList("invalid-cookie", "234.23.12.2.4", list._id);
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
      expect(response.data).not.toBeDefined();
    }

    try {
      await listCtrl.getList(cookie, "invalid-ip", list._id);
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
      expect(response.data).not.toBeDefined();
    }
  });

  it("change list name", async () => {
    if (!list) fail("List is not defined");

    try {
      const response = await listCtrl.changeName(cookie, "234.23.12.2.4", list._id, "Updated name");

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Changed list name");
      // check if list changed
      const { data: { name: updatedListName } } = await listCtrl.getList(cookie, "234.23.12.2.4", list._id);
      expect(updatedListName).toBe("Updated name");
    } catch (err) {
      fail(err);
    }

    try {
      await listCtrl.changeName("invalid-cookie", "234.23.12.2.4", list._id, "Updated name");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await listCtrl.changeName(cookie, "invalid-ip", list._id, "Updated name");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
      expect(response.data).not.toBeDefined();
    }
  });

  it("update list description", async () => {
    if (!list) fail("List is not defined");

    try {
      const response = await listCtrl.updateDescription(cookie, "234.23.12.2.4", list._id, "Very descriptive list description");

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Updated list description");
      // check if description is saved
      const { data: { description: updatedListDescription } } = await listCtrl.getList(cookie, "234.23.12.2.4", list._id);
      expect(updatedListDescription).toBe("Very descriptive list description");
    } catch (err) {
      fail(err);
    }

    try {
      await listCtrl.updateDescription("invalid-cookie", "234.23.12.2.4", list._id, "Very description list description");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code")
    }

    try {
      await listCtrl.updateDescription(cookie, "invalid-ip", list._id, "Very description list description");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password")
    }
  });

  it("update list icon", async () => {
    if (!list) fail("List is not defined");

    try {
      const response = await listCtrl.updateIcon(cookie, "234.23.12.2.4", list._id, "http://example.com/example.icon");

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Changed icon URL");
      // check if list icon updated
      const { data: { icon: updatedListIcon } } = await listCtrl.getList(cookie, "234.23.12.2.4", list._id);
      expect(updatedListIcon).toBe("http://example.com/example.icon");
    } catch (err) {
      fail(err);
    }

    try {
      await listCtrl.updateIcon(cookie, "234.23.12.2.4", list._id, "invalid-url");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Invalid URL");
    }

    try {
      await listCtrl.updateIcon("invalid-cookie", "234.23.12.2.4", list._id, "http://example.com/example.icon");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await listCtrl.updateIcon(cookie, "invalid-ip", list._id, "http://example.com/example.icon");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("delete list", async () => {
    if (!list) fail("List is not defined");

    try {
      await listCtrl.removeList("invalid-cookie", "234.23.12.2.4", list._id);
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await listCtrl.removeList(cookie, "invalid-ip", list._id);
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }

    try {
      const response = await listCtrl.removeList(cookie, "234.23.12.2.4", list._id);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Removed list");
      // checking if list is deleted
      await listCtrl.getList(cookie, "234.23.12.2.4", list._id);
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(404);
      expect(response.message).toBe("List does not exist");
    }
  });
});
