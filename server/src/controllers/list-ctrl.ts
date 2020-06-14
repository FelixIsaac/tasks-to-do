import sanitize from "mongo-sanitize";
import { Schema } from "mongoose";
import { getUserByCookie } from "./user-ctrl";
import Lists, { IListDocument, ITaskDocument } from "../db/models/list";
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


  return { user, owner: (user.lists as Schema.Types.ObjectId[]).includes(listID) };
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

// * Tasks

export const createTask = async (cookie: string, ip: string, title: ITaskDocument["title"], listID: IListDocument["_id"]) => {
  if (!title) throw {
    error: true,
    status: 400,
    message: "Missing task title"
  };

  const { data: list } = await getList(cookie, ip, listID);

  if (!list) throw {
    error: true,
    status: 401,
    message: "List does not exist"
  };

  // create task
  list.tasks.push({
    title: sanitize(title),
    list: sanitize(listID),
    activity: [{ action: "CREATED", detail: "", date: new Date() }]
  });

  await list.save();

  return {
    error: false,
    status: 200,
    message: "Created task"
  };
};

export const verifyTaskOwner = async (cookie: string, ip: string, taskID: ITaskDocument["_id"]) => {
  if (!taskID) throw {
    error: true,
    status: 400,
    message: "Missing list ID"
  };

  const user = await getUserByCookie(cookie, ip);

  if (!user) throw {
    error: true,
    status: 400,
    message: "Invalid email or password"
  }

  const list = await Lists.findOne({ "tasks._id": taskID });

  if (!list) throw {
    error: true,
    status: 400,
    message: "Task or list does not exist"
  };

  return { user, list, owner: list.user.toString() === user._id.toString() };
};

export const updateTaskTitle = async (cookie: string, ip: string, newTitle: ITaskDocument["title"], taskID: ITaskDocument["_id"]) => {
  if (!newTitle || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing new task title"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  list.tasks.id(taskID).title = sanitize(newTitle);
  await list.save()

  return {
    error: false,
    status: 200,
    message: "Updated task title"
  };
};

