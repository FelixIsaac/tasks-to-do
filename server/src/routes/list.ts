import Router from 'koa-router';
import * as listCtrl from "../controllers/lists-ctrl";
const router = new Router({ prefix: "/lists" });

router.get("/:id", async (ctx) => {
  const session = ctx.cookies.get("session");

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    const response = await listCtrl.getList(session, ctx.ip, ctx.params.id);

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.post("/", async (ctx) => {
  const { name, description } = ctx.request.body || {};
  const session = ctx.cookies.get("session");

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    const response = await listCtrl.createList(session, ctx.ip, name, description)

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.patch("/update/:id/:action", async (ctx) => {
  const { id: listID, action } = ctx.params;
  const session = ctx.cookies.get("session");
  const ip = ctx.ip;

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    switch(action.toLowerCase()) {
      case "name": {
        let response = await listCtrl.changeName(session, ip, listID, ctx.request.body.newName);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "description": {
        let response = await listCtrl.updateDescription(session, ip, listID, ctx.request.body.description);

        ctx.status = response.status;
        ctx.body = response;
        break;
      }
      case "icon": {
        let response = await listCtrl.updateIcon(session, ip, listID, ctx.request.body.iconURL);

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

router.delete("/:id", async (ctx) => {
  const session = ctx.cookies.get("session");

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    const response = await listCtrl.removeList(session, ctx.ip, ctx.params.id);

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

export default router;
