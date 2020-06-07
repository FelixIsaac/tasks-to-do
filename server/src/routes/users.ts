import Router from "koa-router";
import * as users from "../controllers/user-ctrl";
const router = new Router({ prefix: "/users" });

router.post('/register', (ctx) => {
  const { body, rawBody } = ctx.request;

  if (!body) {
    ctx.status = 400;
    ctx.body = {
      error: true,
      status: 400,
      message: "Missing body"
    };

    return;
  }

  users.createUser(body.username, body.email, body.password)
    .then(r => {
      ctx.status = r.status;
      ctx.body = r;
    })
    .catch(r => {
      ctx.status = r.status;
      ctx.body = r;
    });
});

export default router;
