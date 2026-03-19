import Koa from "koa";
import { createHandler } from "graphql-http/lib/use/koa";
import mount from "koa-mount";
import { schema } from "../schema/schema";
import cors from "@koa/cors";
import logger from "koa-logger";
import { config } from "../config";
import { findValidSession } from "../modules/sessions/sessionService";
import type { GraphQLContext } from "../types/auth";

const app = new Koa();

app.keys = [config.SESSION_SECRET];

export async function getAuthContextFromSessionToken(
	sessionToken: string | undefined,
): Promise<GraphQLContext> {
	if (!sessionToken) {
		return {};
	}

	const validSession = await findValidSession(sessionToken);

	if (!validSession) {
		return {};
	}

	return {
		auth: {
			userId: validSession.userId,
			role: validSession.role,
		},
		sessionToken: validSession.token,
	};
}

app.use(
	cors({
		origin: config.CORS_ORIGIN,
		credentials: true,
	}),
);
app.use(logger());

app.use(
	mount(
		"/graphql",
		createHandler({
			schema,
			context: async ({ context: { res } }) => {
				const { cookies } = res.ctx;

				const sessionToken = cookies.get(config.SESSION_COOKIE_NAME, {
					signed: true,
				});

				const authContext = await getAuthContextFromSessionToken(sessionToken);

				const requestContext = {
					setSessionCookie: (token: string, expiresAt: Date) => {
						cookies.set(config.SESSION_COOKIE_NAME, token, {
							httpOnly: true,
							signed: true,
							sameSite: "lax",
							secure: false,
							expires: expiresAt,
							overwrite: true,
						});
					},
					clearSessionCookie: () => {
						cookies.set(config.SESSION_COOKIE_NAME, "", {
							httpOnly: true,
							signed: true,
							sameSite: "lax",
							secure: false,
							expires: new Date(0),
							overwrite: true,
						});
					},
				};

				return {
					...authContext,
					requestContext,
				};
			},
		}),
	),
);

export { app };
