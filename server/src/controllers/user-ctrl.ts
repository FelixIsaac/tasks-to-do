import Users from "../db/models/users";
import sanitize from "mongo-sanitize";
import bcrypt from "bcrypt";
import { encrypt } from "../utils/encryption";

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
    const encryptedEmail = encrypt(email);

    await new Users(sanitize({
      username,
      email: encryptedEmail,
      authorization: {
        password: await bcrypt.hash(`[${encrypt(username)}:${username}]${encryptedEmail}${password}`, 12)
      }
    })).save();

    return {
      error: false,
      status: 200,
      message: "Successfully created user"
    };
  } catch (err) {
    if (err.name === "ValidationError") return {
      error: false,
      status: 200,
      message: "Successfully created user"
    };

    throw {
      error: true,
      status: 400,
      message: err.message
    };
  }
};

export const loginUser = async (email: string, password: string, ip: string) => {
  const user = await Users.findOne({ email: sanitize(encrypt(email)) });

  if (!user) throw {
    error: true,
    status: 400,
    message: "Invalid email or password"
  };

  // compare password
  const isPassword = await bcrypt.compare(`[${encrypt(user.username)}:${user.username}]${encrypt(email)}${password}`, user.authorization.password);

  if (!isPassword || !ip) throw {
    error: true,
    status: 400,
    message: "Invalid email or password"
  };

  return encrypt(`${encrypt(email)}${await bcrypt.hash(ip, 6)}`);
};

export const changeEmail = async (email: string, newEmail: string, password: string) => {
  if (!email || !newEmail || !password) throw {
    error: true,
    status: 400,
    message: "Invalid email or password"
  };


};

export const changePassword = async (email: string, password: string, newPassword: string) => {

};

export const removeUser = async (email: string, code: string) => {

};
