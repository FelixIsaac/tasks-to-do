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

export default router;
