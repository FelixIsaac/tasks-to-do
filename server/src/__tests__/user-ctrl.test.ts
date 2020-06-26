import mongoose  from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as userCtrl from "../controllers/user-ctrl";
import Users, { IUserDocument } from "../db/models/users";

describe("User model test", () => {
  // Additional time for downloading MongoDB binaries.
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

  let mongoServer: MongoMemoryServer;
  let cookie: string;
  let user: IUserDocument | null;

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
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop()
  });

  it("save user", async () => {
    const response = await userCtrl.createUser("Felix", "felix@felixisaac.dev", "strong p@ssW0rd");

    // check response
    expect(response.error).toBeFalsy();
    expect(response.status).toBe(200);
    expect(response.message).toBe("Successfully created user");

    try {
      await userCtrl.createUser("F:", "felix@felixisaac.dev", "strong p@ssW0rd");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Username length cannot be more than 32 or less than 3 or cannot include ':'");
    }

    try {
      await userCtrl.createUser("Felix", "fffff@fff.", "strong p@ssW0rd");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Invalid email address");
    }

    try {
      await userCtrl.createUser("Felix", "felix@felixisaac.dev", "weak pass");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Password too insecure, must have a length of more than eight and include one special character, uppercase, lowercase, and a digit without including ':'.")
    }
  });

  it("user login", async () => {
    try {
      cookie = await userCtrl.loginUser("felix@felixisaac.dev", "strong p@ssW0rd", "234.23.12.2.4");

      expect(typeof cookie).toBe("string");
      user = await userCtrl.getUserByCookie(cookie, "234.23.12.2.4");

      if (!user) fail("No cookie returned");

      expect(user._id).toBeDefined();
      expect(user).not.toBeUndefined();
      expect(user.username).toBe("Felix");
      expect(user.email).not.toBe("felix@felixisaac.dev");
      expect(user.authorization).not.toBe("strong p@ssW0rd");
    } catch (err) {
      fail(err);
    }

    try {
      await userCtrl.loginUser("felix@norealemail.com", "strong p@ssW0rd", "14.6.73.4");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }

    try {
      await userCtrl.loginUser("felix@felixisaac.dev", "wrong password", "14.325.6.7");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it ("change username", async () => {
    if (!user) return fail("User not defined");

    try {
      const response = await userCtrl.changeUsername(user._id, "Isaac", "strong p@ssW0rd");

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Changed username");
    } catch (err) {
      fail(err);
    }

    try {
      await userCtrl.changeUsername(user._id, "F", "strong p@ssW0rd");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Username length cannot be more than 32 or less than 3 or cannot include ':'");
    }

    try {
      await userCtrl.changeUsername(user._id, "Isaac", "wrong password");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("change email address", async () => {
    if (!user) fail("User not defined");

    try {
      const response = await userCtrl.changeEmail(user._id, "me@felixisaac.dev", "strong p@ssW0rd");

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Sent email confirmation");
      expect(response.code).toBeDefined();

      const changingEmailResponse = await userCtrl.verifyEmailChange(response.code, "strong p@ssW0rd");

      expect(changingEmailResponse.error).toBeFalsy();
      expect(changingEmailResponse.status).toBe(200);
      expect(changingEmailResponse.message).toBe("Changed email");

      await userCtrl.verifyEmailChange(response.code, "wrong p@ssW0rd");
      fail("Meant to have error");
    } catch (response) {
      if (!response.error) fail(response);

      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid code or password");
    }

    try {
      await userCtrl.verifyEmailChange("invalid-code", "strong p@ssW0rd");
      fail("Meant to have error");
    } catch (response) {
      if (!response.error) fail(response);

      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await userCtrl.changeEmail(user._id, "me@felixisaac.dev", "strong p@ssW0rd");
      fail("Meant to have error");
    } catch (response) {
      if (!response.error) fail(response);

      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Cannot be the same email");
    }

    try {
      await userCtrl.changeEmail(user._id, "isaac@felixisaac.dev", "wrong p@sswW0rd");
      fail("Meant to have error");
    } catch (response) {
      if (!response.error) fail(response);

      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("change password", async () => {
    if (!user) fail("User not defined");

    try {
      await userCtrl.changePassword(user._id, "strong p@ssW0rd", "insecure password");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("New password too insecure, must have a length of more than eight and include one special character, uppercase, lowercase, and a digit without including ':'.");
    }

    try {
      await userCtrl.changePassword(user._id, "wrong p@ssW0rd", "good new p@ssW0rd");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }

    try {
      const response = await userCtrl.changePassword(user._id, "strong p@ssW0rd", "more secure p@ssW0rd");

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Changed password");
    } catch (err) {
      fail(err);
    }
  });

  it("delete user", async () => {
    if (!user) fail("User not defined");

    try {
      await userCtrl.removeUser(user._id, "wrong p@ssW0rd");
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }

    try {
      const response = await userCtrl.removeUser(user._id, "more secure p@ssW0rd");

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Removed user");

      const users = await Users.find({});
      expect(users).toHaveLength(0);
    } catch (err) {
      fail(err);
    }
  });
});
