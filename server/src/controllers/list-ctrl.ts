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

export const verifyListOwner = async (cookie: string, ip: string, listID: IListDocument["_id"], returnOwner = false) => {
  if (!listID) throw {
    error: true,
    status: 400,
    message: "Missing new list ID"
  };

  // verify user cookie
  const user = await getUserByCookie(cookie, ip);

  if (!user) throw {
    error: true,
    status: 400,
    message: "User does not exists"
  };

  if (returnOwner && user.lists.includes(listID as IListDocument["_id"])) return user;
  return user.lists.includes(listID as IListDocument["_id"]);
};

export const changeName = async (cookie: string, ip: string, listID: IListDocument["_id"], newName: IListDocument["name"]) => {
  if (!newName || !listID) throw {
    error: true,
    status: 400,
    message: "Missing new list name"
  };

  const list = await Lists.findById(listID);

  if (!list) throw {
    error: true,
    status: 400,
    message: "List does not exists"
  };

  if (!await verifyListOwner(cookie, ip, listID)) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  // changing list name
  list.name = newName;
  const response = await list.save();

  if (response.name === newName) return {
    error: false,
    status: 200,
    message: "Changed list name"
  };
  else throw {
    error: true,
    status: 500,
    message: "Failed to change list name"
  };
};

export const updateDescription = async (cookie: string, ip: string, listID: IListDocument["_id"], updatedDesc: IListDocument["description"]) => {
  if (!updatedDesc) throw {
    error: true,
    status: 400,
    message: "Missing updated list description"
  };

  const list = await Lists.findById(listID);

  if (!list) throw {
    error: true,
    status: 400,
    message: "List does not exists"
  };

  if (!await verifyListOwner(cookie, ip, listID)) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  // updating list description
  list.description = updatedDesc;
  const response = await list.save();

  if (response.description === updatedDesc) return {
    error: false,
    status: 200,
    message: "Updated list description"
  }
  else throw {
    error: true,
    status: 500,
    message: "Failed to change list description"
  };
};

