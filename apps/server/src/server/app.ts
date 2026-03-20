import Koa from "koa";
import { createHandler } from "graphql-http/lib/use/koa";
import mount from "koa-mount";
import { schema } from "../schema/schema";
import cors from "@koa/cors";
import logger from "koa-logger";
import { config } from "../config";
import { handleWooviWebhookRequest } from "../modules/deposits/wooviWebhookService";
import { findValidSession } from "../modules/sessions/sessionService";
import type { GraphQLContext } from "../types/auth";

const app = new Koa();

// Production traffic reaches Koa through a reverse proxy/load balancer.
app.proxy = true;

function readRawRequestBody(req: Koa.Request["req"]) {
	return new Promise<Buffer>((resolve, reject) => {
		const chunks: Buffer[] = [];

		req.on("data", (chunk) => {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		});
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}

function buildWebRequestFromKoa(ctx: Koa.Context, body: Buffer) {
	const headers = new Headers();

	for (const [key, value] of Object.entries(ctx.request.headers)) {
		if (!value) {
			continue;
		}

		if (Array.isArray(value)) {
			for (const item of value) {
				headers.append(key, item);
			}
			continue;
		}

		headers.set(key, value);
	}

	const requestUrl = `${ctx.protocol}://${ctx.host}${ctx.originalUrl}`;
	const requestInit: RequestInit = {
		method: ctx.method,
		headers,
	};

	if (ctx.method !== "GET" && ctx.method !== "HEAD") {
		requestInit.body = body.toString("utf8");
	}

	return new Request(requestUrl, requestInit);
}

function getApolloSandboxHtml(endpoint: string): string {
	return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width,initial-scale=1" />
		<title>Apollo Sandbox</title>
		<style>
			html, body, #embeddableSandbox {
				width: 100%;
				height: 100%;
				margin: 0;
				padding: 0;
				overflow: hidden;
			}
		</style>
	</head>
	<body>
		<div id="embeddableSandbox"></div>
		<script src="https://embeddable-sandbox.cdn.apollographql.com/_latest/embeddable-sandbox.umd.production.min.js"></script>
		<script>
			const options = {
				target: "#embeddableSandbox",
				initialEndpoint: "${endpoint}",
			};

			if (typeof window.EmbeddedSandbox === "function") {
				new window.EmbeddedSandbox(options);
			} else if (
				window.EmbeddedSandbox &&
				typeof window.EmbeddedSandbox.renderEmbeddedSandbox === "function"
			) {
				window.EmbeddedSandbox.renderEmbeddedSandbox(options);
			} else {
				document.getElementById("embeddableSandbox").innerText =
					"Unable to load Apollo Sandbox.";
			}
		</script>
	</body>
</html>`;
}

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

app.use(async (ctx, next) => {
	if (ctx.path === "/webhooks/woovi" && ctx.method === "POST") {
		try {
			const body = await readRawRequestBody(ctx.req);
			const request = buildWebRequestFromKoa(ctx, body);
			const response = await handleWooviWebhookRequest(request);

			ctx.status = response.status;
			response.headers.forEach((value, key) => {
				ctx.set(key, value);
			});

			ctx.body = await response.text();
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Erro ao processar webhook Woovi", error);
			ctx.status = 500;
			ctx.body = "Erro interno ao processar webhook Woovi";
		}

		return;
	}

	if (ctx.path === "/graphql" && ctx.method === "GET" && ctx.accepts("html")) {
		const endpoint = `${ctx.protocol}://${ctx.host}/graphql`;
		ctx.status = 200;
		ctx.type = "text/html";
		ctx.body = getApolloSandboxHtml(endpoint);
		return;
	}

	await next();
});

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
							secure: process.env.NODE_ENV === "production",
							expires: expiresAt,
							overwrite: true,
						});
					},
					clearSessionCookie: () => {
						cookies.set(config.SESSION_COOKIE_NAME, "", {
							httpOnly: true,
							signed: true,
							sameSite: "lax",
							secure: process.env.NODE_ENV === "production",
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
