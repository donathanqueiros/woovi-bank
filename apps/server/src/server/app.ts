import Koa from "koa";
import { createHandler } from "graphql-http/lib/use/koa";
import mount from "koa-mount";
import { schema } from "../schema/schema";

const app = new Koa();

app.use(mount("/graphql", createHandler({ schema })));

export { app };
