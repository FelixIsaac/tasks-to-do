import Router from 'koa-router';
import * as taskCtrl from "../controllers/tasks-ctrl";
const router = new Router({ prefix: "/tasks" });

router.post("/:listID", async (ctx) =>{
  const session = ctx.cookies.get("session");

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    const response = await taskCtrl.createTask(session, ctx.ip, ctx.request.body.title, ctx.params.listID);

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.post("/:taskID/:action", async (ctx) => {
  const { taskID, action } = ctx.params;
  const session = ctx.cookies.get("session");
  const ip = ctx.ip;

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    switch(action.toLowerCase()) {
      case "attachments": {
        const response = await taskCtrl.addTaskAttachments(session, ip, ctx.request.body.attachments, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "checklist": {
        const response = await taskCtrl.addTaskChecklists(session, ip, ctx.request.body.checklists, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      default:
        ctx.status = 404;
        return ctx.body = "Not Found";
    }
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.patch("/:taskID/:action", async (ctx) => {
  const { taskID , action } = ctx.params;
  const session = ctx.cookies.get("session");
  const ip = ctx.ip;

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    switch(action.toLowerCase()) {
      case "title": {
        const response = await taskCtrl.updateTaskTitle(session, ip, ctx.request.body.newTitle, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "description": {
        const response = await taskCtrl.changeTaskDescription(session, ip, ctx.request.body.description, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "attachment": {
        const { attachment, index} = ctx.request.body;
        const response = await taskCtrl.updateTaskAttachment(session, ip, { attachment, index }, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "checklist": {
        const { index, newTitle } = ctx.request.body || {};
        const response = await taskCtrl.updateTaskChecklistTitle(session, ip, { index, newTitle }, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "complete": {
        const response = await taskCtrl.toggleCompleteTask(session, ip, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "cover": {
        const { cover } = ctx.request.body || {};
        const response = await taskCtrl.updateTaskCover(session ,ip , cover, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      default:
        ctx.status = 404;
        return ctx.body = "Not Found";
    }
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.patch("/:taskID/checklists/:action", async (ctx) => {
  const { taskID , action } = ctx.params;
  const session = ctx.cookies.get("session");
  const ip = ctx.ip;

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    switch (action.toLowerCase()) {
      case "due": {
        const { due, index } = ctx.request.body || {};
        const response = await taskCtrl.dueTaskChecklist(session, ip, { due, index }, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "remind": {
        const { reminder, index } = ctx.request.body || {};
        const response = await taskCtrl.remindTaskChecklist(session, ip, { reminder, index }, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "complete": {
        const { stepIndex, checklistIndex } = ctx.request.body || {};
        const response = await taskCtrl.toggleCompleteChecklistStep(session, ip, stepIndex, checklistIndex, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
    }
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.delete("/:taskID/:action?", async (ctx) => {
  const { taskID , action } = ctx.params;
  const session = ctx.cookies.get("session");
  const ip = ctx.ip;

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    switch(action.toLowerCase()) {
      case "attachments": {
        const response = await taskCtrl.removeTaskAttachment(session, ip, ctx.request.body.index, taskID);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "checklist": {
        break;
      }
      default: {
        // remove task
        break;
      }
    }
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

export default router;
