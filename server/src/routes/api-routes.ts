import Router from "koa-router";
// routes
import users from "./users";
import list from "./list";

const apiRouter = new Router({ prefix: "/api" });
const routers = [list, users];

for (let router of routers) {
  apiRouter.use(router.routes(), router.allowedMethods());
}

export default apiRouter;
