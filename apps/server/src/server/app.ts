import Koa from "koa";
import { createHandler } from "graphql-http/lib/use/koa";
import mount from "koa-mount";
import { schema } from "../schema/schema";
import cors from "@koa/cors";
import logger from "koa-logger";

const app = new Koa();

app.use(cors({ origin: "*" }));
app.use(logger());

app.use(mount("/graphql", createHandler({ schema })));

export { app };
