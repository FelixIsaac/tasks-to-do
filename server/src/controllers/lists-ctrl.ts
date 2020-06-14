import sanitize from "mongo-sanitize";
import { Types } from "mongoose";
import { getUserByCookie } from "./user-ctrl";
import Lists, { IListDocument } from "../db/models/list";
import { IUserDocument } from "../db/models/users";

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
    message: "User does not exist"
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

export const verifyListOwner = async (cookie: string, ip: string, listID: IListDocument["_id"])=> {
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
    message: "Invalid email or password"
  };


  return { user, owner: (user.lists as Types.ObjectId[]).includes(listID) };
};

export const getList = async (cookie: string, ip: string, listID: IListDocument["_id"]) => {
  if (!listID) throw {
    error: true,
    status: 400,
    message: "Missing list ID"
  };

  const { owner } = await verifyListOwner(cookie, ip, listID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const list = await Lists.findById(listID).populate('user', 'username lists');

  if (!list) throw {
    error: true,
    status: 400,
    message: "List does not exist"
  };

  return {
    error: false,
    status: 200,
    data: list as IListDocument
  };
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
    message: "List does not exist"
  };

  if (!(await verifyListOwner(cookie, ip, listID)).owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  // changing list name
  list.name = sanitize(newName);
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
    message: "List does not exist"
  };

  if (!(await verifyListOwner(cookie, ip, listID)).owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  // updating list description
  list.description = sanitize(updatedDesc);
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

export const updateIcon = async (cookie: string, ip: string, listID: IListDocument["_id"], iconURL: IListDocument["icon"]) => {
  if (!iconURL) throw {
    error: true,
    status: 400,
    message: "Missing icon URL"
  };

  if (!/^http(s)?:\/\/.+\..+$/.test(iconURL)) throw {
    error: true,
    status: 400,
    message: "Invalid URL"
  };

  const list = await Lists.findById(listID);

  if (!list) throw {
    error: true,
    status: 400,
    message: "List does not exist"
  };

  if (!(await verifyListOwner(cookie, ip, listID)).owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  // updating list description
  list.icon = sanitize(iconURL);
  const response = await list.save();

  if (response.icon === iconURL) return {
    error: false,
    status: 200,
    message: "Changed icon URL"
  }
  else throw {
    error: true,
    status: 500,
    message: "Failed to change icon URL"
  };
};

export const removeList = async (cookie: string, ip: string, listID: IListDocument["_id"]) => {
  if (!listID) throw {
    error: true,
    status: 400,
    message: "List does not exist"
  };

  const list = await Lists.findById(listID);

  if (!list) throw {
    error: true,
    status: 400,
    message: "List does not exist"
  };

  const { user, owner: isListOwner } = await verifyListOwner(cookie, ip, listID);

  if (!isListOwner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  list.remove();
  user.lists.splice(user.lists.findIndex((list: IUserDocument["lists"][0]) => list === listID), 1);
  await user.save();

  return {
    error: false,
    status: 200,
    message: "Removed list"
  }
};
