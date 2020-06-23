// config
import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();
import Koa from 'koa';
import bodyParser from "koa-bodyparser";
import apiRoutes from './routes/api-routes';
import("./db")

const app = new Koa();

app.use(bodyParser());
app.use(apiRoutes.routes());
app.use(apiRoutes.allowedMethods());

export default app;
