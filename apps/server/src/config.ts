import fs from "fs";
import path from "path";

import dotenvSafe from "dotenv-safe";

const cwd = process.cwd();
const envRootCandidates = [
  cwd,
  path.resolve(cwd, "..", "server"),
  path.resolve(cwd, "apps", "server"),
];
const envRoot =
  envRootCandidates.find((candidate) =>
    fs.existsSync(path.join(candidate, ".env.example")),
  ) ?? cwd;
const root = (...segments: string[]) => path.resolve(envRoot, ...segments);

dotenvSafe.config({
  path: root(".env"),
  sample: root(".env.example"),
});

const ENV = process.env;

const config = {
  PORT: ENV.PORT ?? 4000,
  MONGO_URI: ENV.MONGO_URI ?? "",
  CORS_ORIGIN: ENV.CORS_ORIGIN ?? "http://localhost:5173",
  SESSION_SECRET: ENV.SESSION_SECRET ?? "dev-session-secret",
  SESSION_COOKIE_NAME: ENV.SESSION_COOKIE_NAME ?? "woovi_session",
  WOOVI_APP_ID: ENV.WOOVI_APP_ID ?? "",
  WOOVI_BASE_URL: ENV.WOOVI_BASE_URL ?? "",
};

export { config };
