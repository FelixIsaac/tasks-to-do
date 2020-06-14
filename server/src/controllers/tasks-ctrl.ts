import sanitize from "mongo-sanitize";
import { Types } from "mongoose";
import { ITaskDocument } from "../db/models/tasks";
import Lists, { IListDocument } from "../db/models/list";
import { getList } from "./lists-ctrl";
import { getUserByCookie } from "./user-ctrl";

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
  };

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
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Updated task title"
  };
};

export const changeTaskDescription = async (cookie: string, ip: string, newDescription: ITaskDocument["description"], taskID: ITaskDocument["_id"]) => {
  if (!newDescription || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing new task description"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  list.tasks.id(taskID).description = sanitize(newDescription);
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Updated task description"
  };
};

