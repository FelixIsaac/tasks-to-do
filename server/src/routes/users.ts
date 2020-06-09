import Router from "koa-router";
import * as users from "../controllers/user-ctrl";
const router = new Router({ prefix: "/users" });

router.post('/register', async (ctx) => {
  const { body } = ctx.request;

  if (!body) {
    ctx.status = 400;
    ctx.body = {
      error: true,
      status: 400,
      message: "Missing credentials"
    };

    return;
  }

  try {
    const user = await users.createUser(body.username, body.email, body.password);

    ctx.status = user.status;
    ctx.body = user;
  } catch (err) {
    ctx.status = err.status;
    ctx.body = err;
  }
});

router.post('/login', async  (ctx) => {
  const { body } = ctx.request;

  if (!body) {
    ctx.status = 400;
    ctx.body = {
      error: true,
      status: 400,
      message: "Missing credentials"
    };
  };

  try {
    const cookie = await users.loginUser(body.email, body.password, ctx.ip);
    ctx.cookies.set("session", cookie, {
      expires: new Date(Date.now() + 1210000000), // 2 weeks
      secure: process.env.NODE_ENV === "production"
    });

    ctx.status = 200;
    ctx.body = {
      error: false,
      status: 200,
      message: "Logging in"
    };
  } catch (err) {
    ctx.status = err.status;
    ctx.body = err;
  }
})

export default router;
