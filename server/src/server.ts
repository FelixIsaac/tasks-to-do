import Koa from 'koa';
import bodyParser from "koa-bodyparser";
import apiRoutes from './routes/api-routes';
import("./db")

const app = new Koa();

app.use(bodyParser());
app.use(apiRoutes.routes());
app.use(apiRoutes.allowedMethods());

app.listen(3000);

export default app;
