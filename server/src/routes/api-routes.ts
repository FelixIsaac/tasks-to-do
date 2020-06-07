import Router from 'koa-router';
// routes
import list from './list';

const apiRouter = new Router({ prefix: "/api" });
const routers = [list];

for (let router of routers) {
  apiRouter.use(router.routes(), router.allowedMethods());
}

export default apiRouter;
