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

  const task = list.tasks.id(taskID);
  task.title = sanitize(newTitle);
  task.activity.push({
    action: "UPDATE",
    detail: `Task title from ${list.tasks.id(taskID).title} to ${sanitize(newTitle)}`,
    date: new Date()
  });

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

  const task = list.tasks.id(taskID);
  task.description = sanitize(newDescription);
  task.activity.push({
    action: "UPDATE",
    detail: `Task description from ${list.tasks.id(taskID).title} to ${sanitize(newDescription)}`,
    date: new Date()
  });

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
    message: "Unauthorized to perform this action"
  };

  // validate attachments
  if (attachments.some((url) => !/^http(s)?:\/\/.+\..+$/.test(url))) throw {
    error: true,
    status: 400,
    message: "One of the attachments has an invalid URL"
  };

  // saving attachments
  const task = list.tasks.id(taskID);
  task.attachments.push(...sanitize(attachments));
  task.activity.push(...attachments.map((title) => ({ action: "CREATE" as "CREATE", detail: `Task attachment ${title}`, date: new Date() })));

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
    message: "Unauthorized to perform this action"
  };

  // validate attachments
  if (!/^http(s)?:\/\/.+\..+$/.test(attachment.attachment)) throw {
    error: true,
    status: 400,
    message: "Invalid attachment URL"
  };

  const task = list.tasks.id(taskID);

  if (!task.attachments[attachment.index]) throw {
    error: true,
    status: 400,
    message: "Attachment not found"
  };

  const updatedAttachments = new Array(...sanitize(task.attachments));
  updatedAttachments[attachment.index] = sanitize(attachment.attachment);

  task.activity.push({
    action: "UPDATE",
    detail: `Task attachment from ${task.attachments[attachment.index]} to ${attachment.attachment}`,
    date: new Date()
  });

  task.attachments = updatedAttachments;

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
  if (attachmentIndex === undefined || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing task index"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);

  if (!task.attachments[attachmentIndex]) throw {
    error: true,
    status: 400,
    message: "Attachment not found"
  };

  task.activity.push({
    action: "DELETE",
    detail: `Task attachment ${task.attachments[attachmentIndex]}`,
    date: new Date()
  });
  task.attachments.splice(attachmentIndex, 1);

  await list.save();

  return {
    error: false,
    status: 200,
    message: "Removed attachment"
  };
};

export const addTaskChecklists = async (cookie: string, ip: string, checklists: ITaskDocument["checklist"], taskID: ITaskDocument["_id"]) => {
  if (!(checklists && checklists.length) || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklists"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  // validation
  if (checklists.some((checklist) => !checklist.title)) throw {
    error: true,
    status: 400,
    message: "Missing checklist title"
  };

  const task = list.tasks.id(taskID);
  task.checklist.push(...sanitize(checklists));
  task.activity.push(...checklists.map(({ title }) => ({ action: "CREATE" as "CREATE", detail: `Created checklist ${title}`, date: new Date() })));

  await list.save();

  return {
    error: false,
    status: 200,
    message: "Created checklist"
  };
};

