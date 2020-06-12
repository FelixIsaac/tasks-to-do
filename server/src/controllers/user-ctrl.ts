import { compare, hash } from "bcrypt";
import sanitize from "mongo-sanitize";
import Users, { IUserDocument } from "../db/models/users";
import { decrypt, encrypt } from "../utils/encryption";
import { sendMail } from "../utils/mail";
import * as validation from "../utils/validation";

export const createUser = async (username: string, email: string, password: string) => {
  if (!username || !email || !password) throw {
    error: true,
    status: 400,
    message: "Missing credentials"
  };

  // username validation
  if (!validation.username(username)) throw {
    error: true,
    status: 400,
    message: "Username length cannot be more than 32 or less than 3 or cannot include ':'"
  };

  // email validation
  if (!validation.email(email)) throw {
    error: true,
    status: 400,
    message: "Invalid email address"
  };

  // password validation
  if (!validation.password(password)) throw {
    error: true,
    status: 400,
    message: "Password too insecure, must include one special character, uppercase, lowercase, and a digit"
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
  return await compare(`${user.username}${user.email}${password}`, user.authorization.password);
};

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

  return encrypt(`${encrypt(encrypt(email))}:${await hash(ip, 6)}`);
};

export const validateCookie = async (cookie: string, ip: string) => {
  if (!cookie) return false;

  const [encryptedEmail = "", hashedIP = ""] = decrypt(cookie).split(':');
  // check IP
  if (!await compare(ip, hashedIP)) return false;
  // check email
  return await Users.exists({ email: decrypt(encryptedEmail) });
};

export const getUserByCookie = async (cookie: string, ip: string) => {
  if (!await validateCookie(cookie, ip)) throw {
    error: true,
    status: 405,
    message: "Invalid email or password"
  };

  return Users.findOne({ email: decrypt(decrypt(cookie).split(':')[0]) });
};

export const changeUsername = async (userID: string, newUsername: string, password: string) => {
  if (!userID || !newUsername || !password) throw {
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

  if (!await comparePassword(user, password)) throw {
    error: true,
    status: 401,
    message: "Invalid email or password",
  };

  // email validation
  if (!validation.username(newUsername)) throw {
    error: true,
    status: 400,
    message: "Username length cannot be more than 32 or less than 3 or cannot include ':'"
  }

  user.username = sanitize(newUsername);
  user.authorization.password = sanitize(password);
  const response = await user.save();

  if (await comparePassword(user, password) && response.username === newUsername) return {
    error: false,
    status: 200,
    message: "Changed username"
  }
  else throw {
    error: true,
    status: 401,
    message: "Failed to change username"
  }
}

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

  // email validation
  if (!validation.email(newEmail)) throw {
    error: true,
    status: 400,
    message: "Invalid email address"
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

export const verifyEmailChange = async (code: string, password: string) => {
  // verify code
  const [email, newEmail, hashedPassword, dateAssigned] = decrypt(code).split(':');
  const user = await Users.findOne({ "email": sanitize(email) });
  const creationDate = new Date(parseInt(dateAssigned));

  if (!email || !newEmail || !hashedPassword || isNaN(creationDate.getTime()) || !user) throw {
    error: true,
    status: 401,
    message: "Invalid code or password"
  };

  // 10 minute expiry
  if (email !== user.email || Date.now() > creationDate.getTime() + 600000) throw {
    error: true,
    status: 401,
    message: "Invalid code or password"
  };

  // verify password
  if (!await comparePassword(user, password)) throw {
    error: true,
    status: 401,
    message: "Invalid code or password"
  };

  // changing email address
  user.email = sanitize(newEmail)
  user.authorization.password = password;
  const response = await user.save();

  if (response.email === newEmail) return {
    error: false,
    status: 200,
    message: "Changed email"
  };
  else throw {
    error: false,
    status: 500,
    message: "Failed to change email"
  };
}

export const changePassword = async (userID: string, password: string, newPassword: string) => {
  if (!userID || !password || !newPassword) throw {
    error: true,
    status: 401,
    message: "Invalid email or password"
  };

  // password validation
  if (!validation.password(password)) throw {
    error: true,
    status: 400,
    message: "Password too insecure, must include one special character, uppercase, lowercase, and a digit"
  };

  if (password === newPassword) throw {
    error: true,
    status: 400,
    message: "Old password and new password cannot be the same"
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

  // set new password
  user.authorization.password = sanitize(newPassword);
  const response = await user.save()

  if (await comparePassword(response, newPassword)) {
    // send alert to email
    await sendMail({
      from: "Account security <accounts@felixisaac.dev>",
      to: decrypt(user.email),
      subject: "Account password changed",
      text: "Your account password has been changed"
    });

    return {
      error: false,
      status: 200,
      message: "Changed password"
    }
  } else throw {
    error: true,
    status: 500,
    message: "Failed to change password"
  }
};

export const removeUser = async (id: string, password: string) => {
  if (!id || !password) throw {
    error: true,
    status: 401,
    message: "Invalid email or password"
  };

  const user = await Users.findById(id);

  if (!user) throw {
    error: true,
    status: 401,
    message: "Invalid email or password"
  };

  if(!await comparePassword(user, password)) throw {
    error: true,
    status: 401,
    message: "Invalid email or password"
  };

  // remove users
  user.remove();

  return {
    error: false,
    status: 200,
    message: "Removed user"
  };
};
