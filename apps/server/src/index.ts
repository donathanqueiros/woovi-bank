import { config } from "./config";
import { connectDatabase } from "./database";
import { startJobs } from "./jobs";
import { schema } from "./schema/schema";
import { app, getAuthContextFromSessionToken } from "./server/app";
import http from "http";
import { useServer } from "graphql-ws/use/ws";
import { WebSocketServer } from "ws";

function readCookieValue(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [cookieKey, ...rawValue] = cookie.trim().split("=");

    if (cookieKey === key) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return undefined;
}

(async () => {
  await connectDatabase();
  startJobs();

  const server = http.createServer(app.callback());

  const wsServer = new WebSocketServer({
    server,
    path: "/graphql",
  });

  useServer(
    {
      schema,
      context: async (ctx) => {
        const sessionToken = readCookieValue(
          ctx.extra.request.headers.cookie,
          config.SESSION_COOKIE_NAME,
        );

        return await getAuthContextFromSessionToken(sessionToken);
      },
    },
    wsServer,
  );

  server.listen(config.PORT, () => {
    // eslint-disable-next-line
    console.log(`Server running on port:${config.PORT}`);
  });
})();
