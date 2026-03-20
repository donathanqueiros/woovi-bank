import mongoose from "mongoose";
import { config } from "./config";
import { LedgerEntry } from "./modules/ledger/LedgerEntryModel";
import { ensureConfiguredAdmin } from "./modules/users/ensureConfiguredAdmin";

async function connectDatabase() {
  // eslint-disable-next-line
  mongoose.connection.on("close", () =>
    console.log("Database connection closed."),
  );

  await mongoose.connect(config.MONGO_URI);
  await LedgerEntry.syncIndexes();
  await ensureConfiguredAdmin();
}

export { connectDatabase };
