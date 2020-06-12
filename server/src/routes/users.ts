import Router from "koa-router";
import * as users from "../controllers/user-ctrl";
const router = new Router({ prefix: "/users" });

router.post("/register", async (ctx) => {
  const { username, email, password } = ctx.request.body || {};

  try {
    const user = await users.createUser(username, email, password);

    ctx.status = user.status;
    ctx.body = user;
  } catch (err) {
    ctx.status = err.status;
    ctx.body = err;
  }
});

router.post("/login", async  (ctx) => {
  const { email, password } = ctx.request.body || {};

  try {
    const cookie = await users.loginUser(email, password, ctx.ip);
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

router.post("/change-email/:id", async (ctx) => {
  const { code, newEmail, password } = ctx.request.body || {};

  try {
    if (code) {
      const response = await users.verifyEmailChange(code);

      ctx.status = response.status;
      ctx.body = response;
    } else {
      const response = await users.changeEmail(ctx.params.id, newEmail, password);

      ctx.status = response.status;
      ctx.body = response;
    }
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.post("/change-password/:id", async (ctx) => {
  const { password, newPassword } = ctx.request.body || {};

  try {
    const response = await users.changePassword(ctx.params.id, password, newPassword);

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

export default router;
