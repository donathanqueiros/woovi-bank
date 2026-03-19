import cron from "node-cron";
import { cleanExpiredSessions } from "./cleanExpiredSessions";
import { getWooviClient } from "../modules/deposits/wooviClient";

export function startJobs() {
  // Roda toda meia-noite para limpar sessões expiradas
  cron.schedule("0 0 * * *", async () => {
    await cleanExpiredSessions();
  });

  //   cron.schedule("*/1 * * * *", async () => {
  //     console.log("[jobs] Running periodic job at", new Date().toISOString());
  //   });

  (async () => {
    const woovi = getWooviClient();
    console.log(
      await woovi.charge.list().catch((err) => {
        console.error("[jobs] Error fetching charges from Woovi:", err);
      }),
    );
  })();

  console.log("[jobs] Cron jobs started");
}
