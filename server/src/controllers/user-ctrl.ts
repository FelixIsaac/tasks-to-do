import Users from "../db/models/users";
import sanitize from "mongo-sanitize";
import bcrypt from "bcrypt";
import { encrypt, decrypt } from "../utils/encryption";

export const createUser = async (username: string, email: string, password: string) => {
  if (!username || username.length < 3 || username.length > 32 || username.includes(":")) throw {
    error: true,
    status: 400,
    message: "Username length cannot be more than 32 or less than 3 or cannot include ':'"
  };

  if (
    !email ||
    !/\S+@\S+/.test(email)
    || email.includes(":")
  ) throw {
    error: true,
    status: 400,
    message: "Invalid email address or cannot include ':'"
  };

  if (!password || password.length < 8 || password.includes(":")) throw {
    error: true,
    status: 400,
    message: "Password length cannot be less than 8 or cannot include ':'"
  };

  try {
    const encryptedEmail = encrypt(`${encrypt(username)}:${email}`);

    await new Users(sanitize({
      username,
      email: encryptedEmail,
      authorization: {
        password: await bcrypt.hash(`${encryptedEmail}:${password}`, 12)
      }
    })).save();

    return {
      error: false,
      status: 200,
      message: "Successfully created user"
    };
  } catch (err) {
    throw {
      error: true,
      status: 400,
      message: err.message
    };
  }
};
