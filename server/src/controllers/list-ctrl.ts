import sanitize from "mongo-sanitize";
import { getUserByCookie } from "./user-ctrl";
import Lists, { IListDocument } from "../db/models/list";

export const createList = async (cookie: string, ip: string, name: IListDocument["name"], description: IListDocument["description"]) => {
  if (!name) throw {
    error: true,
    status: 400,
    message: "Missing list name"
  };

  // verify user cookie
  const user = await getUserByCookie(cookie, ip);

  if (!user) throw {
    error: true,
    status: 400,
    message: "User does not exists"
  };

  const list = await new Lists({
    name: sanitize(name),
    description: sanitize(description),
    user: sanitize(user._id)
  }).save();

  user.lists.push(sanitize(list._id));
  const response = await user.save();

  if (response.lists.includes(list._id)) return {
    error: false,
    status: 200,
    message: "Created list"
  }
  else throw {
    error: true,
    status: 500,
    message: "Failed to create list"
  };
};
