import { createClient } from "@woovi/node-sdk";
import { config } from "../../config";

type WooviClient = ReturnType<typeof createClient>;

let cachedWooviClient: WooviClient | null = null;

export function getWooviClient(): WooviClient {
  if (cachedWooviClient) {
    return cachedWooviClient;
  }

  if (!config.WOOVI_APP_ID) {
    throw new Error("WOOVI_APP_ID nao configurado");
  }

  cachedWooviClient = createClient({
    appId: config.WOOVI_APP_ID,
    ...(config.WOOVI_BASE_URL ? { baseUrl: config.WOOVI_BASE_URL } : {}),
  });

  return cachedWooviClient;
}
