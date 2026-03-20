jest.mock("../../modules/sessions/sessionService", () => ({
	findValidSession: jest.fn(),
}));

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { app } from "../app";
import { config } from "../../config";
import { findValidSession } from "../../modules/sessions/sessionService";

const findValidSessionMock = findValidSession as jest.MockedFunction<
	typeof findValidSession
>;

describe("server app", () => {
	let server: Server;
	let baseUrl: string;
	const originalNodeEnv = process.env.NODE_ENV;

	app.use(async (ctx, next) => {
		if (ctx.path !== "/__test_session_cookie") {
			await next();
			return;
		}

		ctx.cookies.set(config.SESSION_COOKIE_NAME, "session-token", {
			httpOnly: true,
			signed: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			expires: new Date("2026-12-31T00:00:00.000Z"),
			overwrite: true,
		});
		ctx.status = 204;
	});

	beforeAll(async () => {
		server = createServer(app.callback());

		await new Promise<void>((resolve) => {
			server.listen(0, () => resolve());
		});

		const address = server.address() as AddressInfo;
		baseUrl = `http://127.0.0.1:${address.port}`;
	});

	afterAll(async () => {
		process.env.NODE_ENV = originalNodeEnv;

		await new Promise<void>((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}

				resolve();
			});
		});
	});

	it("returns GraphQL data when no session cookie is present", async () => {
		findValidSessionMock.mockResolvedValue(null);

		const response = await fetch(`${baseUrl}/graphql`, {
			method: "POST",
			headers: {
				accept: "application/json",
				"content-type": "application/json",
			},
			body: JSON.stringify({
				query: "{ me { id } }",
			}),
		});

		const responseText = await response.text();

		expect(response.status).toBe(200);
		expect(JSON.parse(responseText)).toEqual({
			data: {
				me: null,
			},
		});
		expect(findValidSessionMock).not.toHaveBeenCalled();
	});

	it("serves Apollo Sandbox when opening GET /graphql in the browser", async () => {
		const response = await fetch(`${baseUrl}/graphql`, {
			method: "GET",
			headers: {
				accept: "text/html",
			},
		});

		const responseText = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(responseText).toContain("Apollo Sandbox");
		expect(responseText).toContain("new window.EmbeddedSandbox");
	});

	it("accepts secure session cookies in production behind a trusted proxy", async () => {
		process.env.NODE_ENV = "production";

		const response = await fetch(`${baseUrl}/__test_session_cookie`, {
			method: "GET",
			headers: {
				"x-forwarded-proto": "https",
			},
		});

		expect(response.status).toBe(204);
		expect(response.headers.get("set-cookie")).toContain(
			`${config.SESSION_COOKIE_NAME}=`,
		);
		expect(response.headers.get("set-cookie")).toContain("secure");
	});
});
