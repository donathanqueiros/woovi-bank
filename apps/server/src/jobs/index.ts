import cron from "node-cron";
import { cleanExpiredSessions } from "./cleanExpiredSessions";
import { getWooviClient } from "../modules/deposits/wooviClient";

export function startJobs() {
  // Roda toda meia-noite para limpar sessões expiradas
  cron.schedule("0 0 * * *", async () => {
    await cleanExpiredSessions();
  });


  console.log("[jobs] Cron jobs started");
}
