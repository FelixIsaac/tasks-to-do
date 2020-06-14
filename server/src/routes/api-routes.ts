import Router from "koa-router";
// routes
import users from "./users";
import list from "./list";
import tasks from "./tasks"

const apiRouter = new Router({ prefix: "/api" });
const routers = [list, users, tasks];

for (let router of routers) {
  apiRouter.use(router.routes(), router.allowedMethods());
}

export default apiRouter;
