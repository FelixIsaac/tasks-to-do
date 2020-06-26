import sanitize from "mongo-sanitize";
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

  const list = await Lists.findOne({ "tasks._id": sanitize(taskID) });

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
    message: `Added task attachment${attachments.length > 1 ? "s" : ""}`
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
  task.activity.push(...checklists.map(({ title }) => ({ action: "CREATE" as "CREATE", detail: `Checklist ${title}`, date: new Date() })));

  await list.save();

  return {
    error: false,
    status: 200,
    message: "Created checklist"
  };
};

export const updateTaskChecklistTitle = async (cookie: string, ip: string, checklist: { newTitle: string, index: number }, taskID: ITaskDocument["_id"]) => {
  if (checklist.index === undefined || !checklist.newTitle || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist ID or new checklist title"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  const taskChecklist = task.checklist[checklist.index];

  if (!taskChecklist) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  task.activity.push({ action: "UPDATE", detail: `Checklist title from ${taskChecklist.title} to ${checklist.newTitle}`, date: new Date() });
  taskChecklist.title = sanitize(checklist.newTitle);
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Updated checklist title"
  };
};

export const dueTaskChecklist = async (cookie: string, ip: string, checklist: { due: Date, index: number }, taskID: ITaskDocument["_id"]) => {
  if (checklist.index === undefined || !checklist.due|| !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist due date or checklist ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  const taskChecklist = task.checklist[checklist.index];

  if (!taskChecklist) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  const dueDate = new Date(checklist.due);

  if (isNaN(dueDate.getTime())) throw {
    error: true,
    status: 400,
    message: "Invalid date"
  };

  taskChecklist.due = sanitize(dueDate);
  task.activity.push({ action: "UPDATE", detail: "Due date", date: new Date() })
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Updated checklist due date"
  };
};

export const removeTaskChecklistDue = async (cookie: string, ip: string, checklistIndex: number, taskID: ITaskDocument["_id"]) => {
  if (checklistIndex === undefined || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  const taskChecklist = task.checklist[checklistIndex];

  if (!taskChecklist) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  // @ts-ignore unset field
  taskChecklist.due = undefined;
  task.activity.push({ action: "DELETE", detail: "Checklist due date", date: new Date() });
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Removed checklist due date"
  };
};

export const remindTaskChecklist = async (cookie: string, ip: string, checklist: { reminder: Date, index: number }, taskID: ITaskDocument["_id"]) => {
  if (checklist.index === undefined || !checklist.reminder || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist reminder date or checklist ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  const taskChecklist = task.checklist[checklist.index];

  if (!taskChecklist) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  const dueDate = new Date(checklist.reminder);

  if (isNaN(dueDate.getTime())) throw {
    error: true,
    status: 400,
    message: "Invalid date"
  };

  taskChecklist.reminder = sanitize(dueDate);
  task.activity.push({ action: "UPDATE", detail: "Reminder date", date: new Date() })
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Updated reminder due date"
  };
};

export const removeTaskChecklistReminder = async (cookie: string, ip: string, checklistIndex: number, taskID: ITaskDocument["_id"]) => {
  if (checklistIndex === undefined || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  const taskChecklist = task.checklist[checklistIndex];

  if (!taskChecklist) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  // @ts-ignore unset field
  taskChecklist.reminder = undefined;
  task.activity.push({ action: "DELETE", detail: "Checklist reminder date", date: new Date() });
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Removed checklist reminder date"
  };
};

export const addChecklistSteps = async (cookie: string, ip: string, steps: string[], checklistIndex: number, taskID: ITaskDocument["_id"]) => {
  if (checklistIndex === undefined || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  const taskChecklist = task.checklist[checklistIndex];

  if (!taskChecklist) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  taskChecklist.steps.push(...steps.map(step => ({ step, completed: false })));
  task.activity.push({ action: "CREATE", detail: "Checklist step", date: new Date() });
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Added steps to checklist"
  };
};

export const removeChecklistStep = async (cookie: string, ip: string, step: number, checklistIndex: number, taskID: ITaskDocument["_id"]) => {
  if (checklistIndex === undefined || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  const taskChecklist = task.checklist[checklistIndex];

  if (!taskChecklist) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  // @ts-ignore unset field
  taskChecklist.steps.splice(step, 1);
  task.activity.push({ action: "DELETE", detail: "Checklist step", date: new Date() });
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Removed checklist step"
  };
};

export const updateChecklistStep = async (cookie: string, ip: string, newStep: string, stepIndex: number, checklistIndex: number, taskID: ITaskDocument["_id"]) => {
  if (checklistIndex === undefined || !newStep || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  const taskChecklist = task.checklist[checklistIndex];

  if (!taskChecklist) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  const checklistStep = taskChecklist.steps[stepIndex];

  if (!checklistStep) throw {
    error: true,
    status: 400,
    message: "Missing checklist step"
  };

  checklistStep.step = newStep;
  task.activity.push({ action: "UPDATE", detail: "Checklist step", date: new Date() });
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Updated checklist step"
  };
};

export const toggleCompleteChecklistStep = async (cookie: string, ip: string, stepIndex: number, checklistIndex: number, taskID: ITaskDocument["_id"]) => {
  if (checklistIndex === undefined || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  const taskChecklist = task.checklist[checklistIndex];

  if (!taskChecklist) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  const checklistStep = taskChecklist.steps[stepIndex];

  if (!checklistStep) throw {
    error: true,
    status: 400,
    message: "Missing checklist step"
  };

  checklistStep.completed = !checklistStep.completed;
  task.activity.push({ action: "UPDATE", detail: checklistStep.completed ? "Checklist step completed" : "Checklist step uncompleted", date: new Date() });
  await list.save();

  return {
    error: false,
    status: 200,
    message: checklistStep.completed ? "Checklist step completed" : "Checklist step uncompleted"
  };
};

export const updateTaskCover = async (cookie: string, ip: string, cover: ITaskDocument["cover"], taskID: ITaskDocument["_id"]) => {
  if (!cover || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing task cover or taskID ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  task.cover = cover;
  task.activity.push({ action: "UPDATE", detail:  "Task cover", date: new Date() });
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Updated task cover"
  };
};

export const toggleCompleteTask = async (cookie: string, ip: string, taskID: ITaskDocument["_id"]) => {
  if (!taskID) throw {
    error: true,
    status: 400,
    message: "Missing taskID ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);
  task.completed = !task.completed;
  task.activity.push({ action: "UPDATE", detail: task.completed ? "Task completed" : "Task uncompleted", date: new Date() });
  await list.save();

  return {
    error: false,
    status: 200,
    message: task.completed ? "Task completed" : "Task uncompleted"
  };
};

export const removeTaskChecklist = async (cookie: string, ip: string, checklistIndex: number, taskID: ITaskDocument["_id"]) => {
  if (checklistIndex === undefined || !taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist index or taskID ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  const task = list.tasks.id(taskID);

  if (!task.checklist[checklistIndex]) throw {
    error: true,
    status: 400,
    message: "Missing checklist"
  };

  task.checklist.splice(checklistIndex, 1);
  task.activity.push({ action: "DELETE", detail: "Task checklist", date: new Date() });
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Removed task checklist"
  };
};

export const removeTask = async (cookie: string, ip: string, taskID: ITaskDocument["_id"]) => {
  if (!taskID) throw {
    error: true,
    status: 400,
    message: "Missing checklist index or taskID ID"
  };

  const { list, owner } = await verifyTaskOwner(cookie, ip, taskID);

  if (!owner) throw {
    error: true,
    status: 401,
    message: "Unauthorized to perform this action"
  };

  list.tasks.id(taskID).remove();
  await list.save();

  return {
    error: false,
    status: 200,
    message: "Remove task"
  };
};
