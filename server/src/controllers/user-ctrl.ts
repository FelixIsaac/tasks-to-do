import { compare, hash } from "bcrypt";
import sanitize from "mongo-sanitize";
import Users, { IUserDocument } from "../db/models/users";
import { decrypt, encrypt } from "../utils/encryption";
import { sendMail } from "../utils/mail";

export const createUser = async (username: string, email: string, password: string) => {
  if (!username || !email || !password) throw {
    error: true,
    status: 400,
    message: "Missing credentials"
  };

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
      authorization: { password }
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

export const comparePassword = async (user: IUserDocument, password: string): Promise<boolean> => {
  return await compare(`[${encrypt(user.username)}:${user.username}]${user.email}${password}`, user.authorization.password);
}

export const loginUser = async (email: string, password: string, ip: string) => {
  const user = await Users.findOne({ email: sanitize(encrypt(email)) });

  if (!user) throw {
    error: true,
    status: 401,
    message: "Invalid email or password"
  };

  // compare password
  if (!await comparePassword(user, password) || !ip) throw {
    error: true,
    status: 401,
    message: "Invalid email or password"
  };

  return encrypt(`${encrypt(email)}${await hash(ip, 6)}`);
};

export const changeEmail = async (userID: string, newEmail: string, password: string) => {
  if (!userID || !newEmail || !password) throw {
    error: true,
    status: 401,
    message: "Invalid email or password"
  };

  const user = await Users.findById(userID);

  if (!user) throw {
    error: true,
    status: 401,
    message: "Invalid email or password"
  };

  // verify if password matches
  if (!await comparePassword(user, password)) throw {
    error: true,
    status: 401,
    message: "Invalid email or password"
  };

  // generate code
  const code = encrypt(`${user.email}:${encrypt(newEmail)}:${await hash(user.authorization.password, 8)}:${Date.now()}`);

  // send verification to old email
  await sendMail({
    from: "Account security <accounts@felixisaac.dev>",
    to: decrypt(user.email),
    subject: "Confirmation of changing email",
    text: `Accept email change: ${process.env.DOMAIN_NAME}/account/change-email?code=${code}`
  });

  return {
    error: false,
    status: 200,
    message: "Sent email confirmation"
  };
};

export const verifyEmailChange = async (code: string) => {
  // verify code
  const [email, newEmail, hashedPassword, dateAssigned] = decrypt(code).split(':');
  const user = await Users.findOne({ "email": sanitize(email) });
  const creationDate = new Date(parseInt(dateAssigned));

  if (!email || !newEmail || !hashedPassword || isNaN(creationDate.getTime()) || !user) throw {
    error: true,
    status: 401,
    message: "Invalid code"
  };

  // 10 minute expiry
  if (email !== user.email || Date.now() > creationDate.getTime() + 600000) throw {
    error: true,
    status: 401,
    message: "Invalid code"
  };

  // changing email address
  const response = await user.update({
    $set: {
      email: newEmail
    }
  });

  if (response.email === newEmail) return {
    error: false,
    status: 200,
    message: "Successfully changed email"
  };
  else throw {
    error: false,
    status: 500,
    message: "Failed to change email"
  };
}

export const changePassword = async (email: string, password: string, newPassword: string) => {

};

export const removeUser = async (email: string, code: string) => {

};
