import Router from 'koa-router';
import * as listCtrl from "../controllers/list-ctrl";
const router = new Router({ prefix: "/lists" });

router.post('/', async (ctx) => {
  const { name, description } = ctx.request.body || {};
  const session = ctx.cookies.get('session');

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    const response = await listCtrl.createList(session, ctx.ip, name, description)

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err;
  }
})

export default router;
