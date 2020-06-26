import mongoose from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
import { loginUser, createUser, getUserByCookie } from "../controllers/user-ctrl";
import { createList, getList } from "../controllers/lists-ctrl";
import * as taskCtrl from "../controllers/tasks-ctrl";
import { IUserDocument } from "../db/models/users";
import { IListDocument } from "../db/models/list";
import { ITaskDocument } from "../db/models/tasks";

describe("Task model test", () => {
  // Additional time for downloading MongoDB binaries.
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

  let mongoServer: MongoMemoryServer;
  let cookie: string;
  let user: IUserDocument | null;
  let list: IListDocument;
  let taskID: ITaskDocument["_id"];

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    await mongoose.connect(await mongoServer.getUri(), {
      useNewUrlParser: true,
      useFindAndModify: true,
      haInterval: 5000,
      useUnifiedTopology: true,
      poolSize: 25,
      acceptableLatencyMS: 25,
      secondaryAcceptableLatencyMS: 100
    }, (err) => err && console.error(err));

    await createUser("Felix", "felix@felixisaac.dev", "strong p@ssW0rd");
    cookie = await loginUser("felix@felixisaac.dev", "strong p@ssW0rd", "234.23.12.2.4");
    await createList(cookie, "234.23.12.2.4", "Test list", "");
    user = await getUserByCookie(cookie, "234.23.12.2.4");
    if (user) list = user.lists[0] as IListDocument;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop()
  });

  it("create task", async () => {
    if (!user) fail("User is not defined");
    if (!list) fail("List is not defined");

    try {
      const response = await taskCtrl.createTask(cookie, "234.23.12.2.4", "Go to dentist appointment", list._id);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Created task");

      const { data: { tasks } } = await getList(cookie, "234.23.12.2.4", list._id);
      expect(tasks).toHaveLength(1);
      taskID = tasks[0]._id;
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.createTask("invalid-cookie", "234.23.12.2.4", "Go to dentist appointment", list._id);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.createTask(cookie, "invalid-cookie", "Go to dentist appointment", list._id);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("get task", async () => {
    if (!user) fail("User is not defined");
    if (!list) fail("List is not defined");

    try {
      const { owner } = await taskCtrl.verifyTaskOwner(cookie, "234.23.12.2.4", taskID);
      expect(owner).toBeTruthy();
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.verifyTaskOwner("invalid-cookie", "234.23.12.2.4", list._id);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.createTask(cookie, "invalid-ip", "Go to dentist appointment", list._id);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("add task attachment", async () => {
    if (!user) fail("User is not defined");
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.addTaskAttachments(cookie, "234.23.12.2.4", ["https://example.com/"], taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Added task attachment")
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.addTaskAttachments("invalid-cookie", "234.23.12.2.4", ["https://example.com"], taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.addTaskAttachments(cookie, "invalid-ip", ["https://example.com"], taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }

    try {
      await taskCtrl.addTaskAttachments(cookie, "234.23.12.2.4", ["invalid-link"], taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("One of the attachments has an invalid URL");
    }
  });

  it("add task checklist", async () => {
    if (!user) fail("User is not defined");
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      // @ts-ignore
      const response = await taskCtrl.addTaskChecklists(cookie, "234.23.12.2.4", [{ title: "Things to do while waiting for dentist" }], taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Created checklist");
    } catch (err) {
      fail(err);
    }

    try {
      // @ts-ignore
      await taskCtrl.addTaskChecklists("invalid-cookie", "234.23.12.2.4", [{ title: "Things to do while waiting for dentist" }], taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      // @ts-ignore
      await taskCtrl.addTaskChecklists(cookie, "invalid-ip", [{ title: "Things to do while waiting for dentist" }], taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }

    try {
      // @ts-ignore
      await taskCtrl.addTaskChecklists(cookie, "234.23.12.2.4", ["invalid-checklist"], taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist title");
    }
  });

  it ("add steps to checklist", async () => {
    if (!user) fail("User is not defined");
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.addChecklistSteps(cookie, "234.23.12.2.4", ["Check emails", "Play chess with bot"], 0, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Added steps to checklist");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.addChecklistSteps(cookie, "234.23.12.2.4", ["Check emails", "Play chess with bot"], 1, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist");
    }

    try {
      await taskCtrl.addChecklistSteps("invalid-cookie", "234.23.12.2.4", ["Check emails", "Play chess with bot"], 1, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.addChecklistSteps(cookie, "invalid-ip", ["Check emails", "Play chess with bot"], 1, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("update task title", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.updateTaskTitle(cookie, "234.23.12.2.4", "Updated title", taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Updated task title");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.updateTaskTitle("invalid-cookie", "234.23.12.2.4", "Updated title", taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.updateTaskTitle(cookie, "invalid-ip", "Updated title", taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it ("update task description", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.changeTaskDescription(cookie, "234.23.12.2.4", "Updated description", taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Updated task description");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.changeTaskDescription("invalid-cookie", "234.23.12.2.4", "Updated description", taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.changeTaskDescription(cookie, "invalid-ip", "Updated description", taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("update task attachment", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.updateTaskAttachment(cookie, "234.23.12.2.4", { index: 0, attachment: "https://example.com/attachment" }, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Updated attachment");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.updateTaskAttachment(cookie, "234.23.12.2.4", { index: 1, attachment: "https://example.com/attachment" }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Attachment not found");
    }

    try {
      await taskCtrl.updateTaskAttachment(cookie, "234.23.12.2.4", { index: 0, attachment: "invalid-link" }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Invalid attachment URL");
    }

    try {
      await taskCtrl.updateTaskAttachment("invalid-cookie", "234.23.12.2.4", { index: 0, attachment: "https://example.com/attachment" }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.updateTaskAttachment(cookie, "invalid-ip", { index: 0, attachment: "https://example.com/attachment" }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("update checklist title", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.updateTaskChecklistTitle(cookie, "234.23.12.2.4", { newTitle: "Updated task title", index: 0 }, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Updated checklist title");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.updateTaskChecklistTitle(cookie, "234.23.12.2.4", { newTitle: "Updated task title", index: 1 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist");
    }

    try {
      await taskCtrl.updateTaskChecklistTitle("invalid-cookie", "234.23.12.2.4", { newTitle: "Updated task title", index: 0 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.updateTaskChecklistTitle(cookie, "invalid-ip", { newTitle: "Updated task title", index: 0 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("complete task", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.toggleCompleteTask(cookie, "234.23.12.2.4", taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Task completed");
    } catch (err) {
      fail(err);
    }

    try {
      const response = await taskCtrl.toggleCompleteTask(cookie, "234.23.12.2.4", taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Task uncompleted");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.toggleCompleteTask("invalid-cookie", "234.23.12.2.4", taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.toggleCompleteTask(cookie, "invalid-ip", taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("update task cover", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.updateTaskCover(cookie, "234.23.12.2.4", "https://example.com/cover", taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Updated task cover");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.updateTaskCover(cookie, "234.23.12.2.4", "invalid-link", taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Invalid link URL");
    }

    try {
      await taskCtrl.updateTaskCover("invalid-cookie", "234.23.12.2.4", "https://example.com/cover", taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.updateTaskCover(cookie, "invalid-ip", "https://example.com/cover", taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("add checklist due", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.dueTaskChecklist(cookie, "234.23.12.2.4", { due: new Date(), index: 0 }, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Updated checklist due date");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.dueTaskChecklist(cookie, "234.23.12.2.4", { due: new Date("invalid date"), index: 0 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Invalid date");
    }

    try {
      await taskCtrl.dueTaskChecklist(cookie, "234.23.12.2.4", { due: new Date(), index: 1 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist");
    }

    try {
      await taskCtrl.dueTaskChecklist("invalid-cookie", "234.23.12.2.4", { due: new Date(), index: 0 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.dueTaskChecklist(cookie, "invalid-ip", { due: new Date(), index: 0 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("add checklist remind", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.remindTaskChecklist(cookie, "234.23.12.2.4", { reminder: new Date(), index: 0 }, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Updated reminder due date");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.remindTaskChecklist(cookie, "234.23.12.2.4", { reminder: new Date("invalid date"), index: 0 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Invalid date");
    }

    try {
      await taskCtrl.remindTaskChecklist(cookie, "234.23.12.2.4", { reminder: new Date(), index: 1 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist");
    }

    try {
      await taskCtrl.remindTaskChecklist("invalid-cookie", "234.23.12.2.4", { reminder: new Date(), index: 0 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.remindTaskChecklist(cookie, "invalid-ip", { reminder: new Date(), index: 0 }, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("complete checklist step", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.toggleCompleteChecklistStep(cookie, "234.23.12.2.4", 0, 0, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Checklist step completed");
    } catch (err) {
      fail(err);
    }

    try {
      const response = await taskCtrl.toggleCompleteChecklistStep(cookie, "234.23.12.2.4", 0, 0, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Checklist step uncompleted");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.toggleCompleteChecklistStep(cookie, "234.23.12.2.4", 0, 1, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist");
    }

    try {
      await taskCtrl.toggleCompleteChecklistStep(cookie, "234.23.12.2.4", 2, 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist step");
    }

    try {
      await taskCtrl.toggleCompleteChecklistStep("invalid-cookie", "234.23.12.2.4", 0, 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.toggleCompleteChecklistStep(cookie, "invalid-ip", 0, 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("delete task attachment", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      await taskCtrl.removeTaskAttachment("invalid-cookie", "234.23.12.2.4", 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.removeTaskAttachment(cookie, "invalid-ip", 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }

    try {
      await taskCtrl.removeTaskAttachment(cookie, "234.23.12.2.4", 1, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Attachment not found");
    }

    try {
      const response = await taskCtrl.removeTaskAttachment(cookie, "234.23.12.2.4", 0, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Removed attachment");
    } catch (err) {
      fail(err);
    }
  });

  it("delete checklist step", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.removeChecklistStep(cookie, "234.23.12.2.4", 0, 0, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Removed checklist step");
    } catch (err) {
      fail(err);
    }

    try {
      const response = await taskCtrl.removeChecklistStep(cookie, "234.23.12.2.4", 0, 0, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Removed checklist step");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.removeChecklistStep(cookie, "234.23.12.2.4", 0, 1, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist");
    }

    try {
      await taskCtrl.removeChecklistStep("invalid-cookie", "234.23.12.2.4", 0, 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.removeChecklistStep(cookie, "invalid-ip", 0, 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("delete checklist due", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.removeTaskChecklistDue(cookie, "234.23.12.2.4", 0, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Removed checklist due date");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.removeTaskChecklistDue(cookie, "234.23.12.2.4", 1, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist");
    }

    try {
      await taskCtrl.removeTaskChecklistDue("invalid-cookie", "234.23.12.2.4", 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.removeTaskChecklistDue(cookie, "invalid-ip", 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("delete checklist reminder", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      const response = await taskCtrl.removeTaskChecklistReminder(cookie, "234.23.12.2.4", 0, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Removed checklist reminder date");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.removeTaskChecklistReminder(cookie, "234.23.12.2.4", 1, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist");
    }

    try {
      await taskCtrl.removeTaskChecklistReminder("invalid-cookie", "234.23.12.2.4", 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.removeTaskChecklistReminder(cookie, "invalid-ip", 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }
  });

  it("delete task checklist", async () => {
    if (!list) fail("List is not defined");
    if (!taskID) fail("Task ID is not defined");

    try {
      await taskCtrl.removeTaskChecklist("invalid-cookie", "234.23.12.2.4", 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid encrypted code");
    }

    try {
      await taskCtrl.removeTaskChecklist(cookie, "invalid-ip", 0, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(401);
      expect(response.message).toBe("Invalid email or password");
    }

    try {
      const response = await taskCtrl.removeTaskChecklist(cookie, "234.23.12.2.4", 0, taskID);

      expect(response.error).toBeFalsy();
      expect(response.status).toBe(200);
      expect(response.message).toBe("Removed task checklist");
    } catch (err) {
      fail(err);
    }

    try {
      await taskCtrl.removeTaskChecklist(cookie, "234.23.12.2.4", 1, taskID);
      fail("Meant to have error");
    } catch (response) {
      expect(response.error).toBeTruthy();
      expect(response.status).toBe(400);
      expect(response.message).toBe("Missing checklist");
    }
  });
});
