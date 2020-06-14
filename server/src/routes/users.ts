import Router from "koa-router";
import * as userCtrl from "../controllers/user-ctrl";

const router = new Router({ prefix: "/users" });

router.get("/:id?", async (ctx) => {
  const session = ctx.cookies.get("session");

  if (!session) {
    ctx.status = 401;
    return ctx.body = {};
  }

  try {
    const { _id: id } = await userCtrl.getUserByCookie(session, ctx.ip) || {};
    const response = await userCtrl.getUserByID(id);

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.post("/register", async (ctx) => {
  const { username, email, password } = ctx.request.body || {};

  try {
    const user = await userCtrl.createUser(username, email, password);

    ctx.status = user.status;
    ctx.body = user;
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status;
    ctx.body = err;
  }
});

router.post("/login", async  (ctx) => {
  const { email, password } = ctx.request.body || {};

  try {
    const cookie = await userCtrl.loginUser(email, password, ctx.ip);
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
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.get("/logout", async (ctx) => {
  try {
    ctx.cookies.set("session", "");

    ctx.status = 200;
    return ctx.body = {
      error: false,
      status: 200,
      message: "Logging out"
    };
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = 500;
    ctx.body = {
      error: true,
      status: 500,
      message: "Failed to logout"
    };
  }
});

router.patch("/change/username/:id", async (ctx) => {
  const { newUsername, password } = ctx.request.body || {};

  try {
    const response = await userCtrl.changeUsername(ctx.params.id, newUsername, password);

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.patch("/change/email/:id", async (ctx) => {
  const { code, newEmail, password } = ctx.request.body || {};

  try {
    if (code) {
      const response = await userCtrl.verifyEmailChange(code, password);

      ctx.status = response.status;
      ctx.body = response;
    } else {
      const response = await userCtrl.changeEmail(ctx.params.id, newEmail, password);

      ctx.status = response.status;
      ctx.body = response;
    }
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.patch("/change/password/:id", async (ctx) => {
  const { password, newPassword } = ctx.request.body || {};

  try {
    const response = await userCtrl.changePassword(ctx.params.id, password, newPassword);

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

router.delete("/:id", async (ctx) => {
  const { password } = ctx.request.body || {};

  try {
    const response = await userCtrl.removeUser(ctx.params.id, password);

    ctx.status = response.status;
    ctx.body = response;
  } catch (err) {
    if (!err.status) console.error(err);

    ctx.status = err.status || 500;
    ctx.body = err;
  }
});

export default router;
