import { config } from "./config";
import { connectDatabase } from "./database";
import { app } from "./server/app";
import http from "http";

(async () => {
  await connectDatabase();

  const server = http.createServer(app.callback());

  server.listen(config.PORT, () => {
    // eslint-disable-next-line
    console.log(`Server running on port:${config.PORT}`);
  });
})();
