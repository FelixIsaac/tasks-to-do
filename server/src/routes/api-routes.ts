import Router from "koa-router";
// routes
import list from "./list";
import users from "./users";

const apiRouter = new Router({ prefix: "/api" });
const routers = [list, users];

for (let router of routers) {
  apiRouter.use(router.routes(), router.allowedMethods());
}

export default apiRouter;
