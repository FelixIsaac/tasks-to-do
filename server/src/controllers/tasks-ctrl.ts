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

export const addTaskAttachments = async (cookie: string, ip: string, attachments: ITaskDocument["attachments"], taskID: ITaskDocument["_id"]) => {
  if (!(attachments && attachments.length) || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing task attachments"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: " Unauthorized to perform this action"
  };

  // validate attachments
  if (attachments.some((url) => !/^http(s)?:\/\/.+\..+$/.test(url))) throw {
    error: true,
    status: 400,
    message: "One of the attachments has an invalid URL"
  };

  // saving attachments
  list.tasks.id(taskID).attachments.push(...sanitize(attachments));
  await list.save();

  return {
    error: false,
    status: 200,
    message: `Added tasked attachment${attachments.length ? "s" : ""}`
  }
};

export const updateTaskAttachment = async (cookie: string, ip: string, attachment: { index: number, attachment: ITaskDocument["attachments"][0] }, taskID: ITaskDocument["_id"]) => {
  if (!(attachment.attachment && attachment.attachment.length) || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing task attachment"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: " Unauthorized to perform this action"
  };

  // validate attachments
  if (!/^http(s)?:\/\/.+\..+$/.test(attachment.attachment)) throw {
    error: true,
    status: 400,
    message: "Invalid attachment URL"
  };

  if (!list.tasks.id(taskID).attachments[attachment.index]) throw {
    error: true,
    status: 400,
    message: "Attachment not found"
  };

  const updatedAttachments = new Array(...list.tasks.id(taskID).attachments);
  updatedAttachments[attachment.index] = attachment.attachment;
  list.tasks.id(taskID).attachments = updatedAttachments;

  const response = await list.save();

  if (response.tasks[response.tasks.findIndex(({ _id }) => _id.equals(taskID))].attachments[attachment.index] === attachment.attachment) return {
    error: false,
    status: 200,
    message: "Updated attachment"
  };
  else throw {
    error: true,
    status: 400,
    message: "Failed to update attachment"
  };
};

export const removeTaskAttachment = async (cookie: string, ip: string, attachmentIndex: number, taskID: ITaskDocument["_id"]) => {
  if (!attachmentIndex || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing task attachment"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: " Unauthorized to perform this action"
  };

  const taskAttachments = list.tasks.id(taskID).attachments;

  if (!taskAttachments[attachmentIndex]) throw {
    error: true,
    status: 400,
    message: "Attachment not found"
  };

  taskAttachments.splice(attachmentIndex, 1);
  const response = await list.save();

  return {
    error: false,
    status: 200,
    message: "Removed attachment"
  };
};

