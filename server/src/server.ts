import Koa from 'koa';
import apiRoutes from './routes/api-routes';

const app = new Koa();

app.use(apiRoutes.routes());
app.use(apiRoutes.allowedMethods());

app.listen(3000);

export default app;
