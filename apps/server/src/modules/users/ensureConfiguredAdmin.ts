import { Account } from "../accounts/AccountModel";
import { LedgerEntry } from "../ledger/LedgerEntryModel";
import { hashPassword } from "./password";
import { User } from "./UserModel";

const INITIAL_CREDIT = 1000;

function extractHolderNameFromEmail(email: string) {
  return email.split("@")[0] ?? "Usuario";
}

export async function ensureConfiguredAdmin() {
  const configuredEmail = process.env.ADM_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADM_PASSWORD;

  if (!configuredEmail || !configuredPassword) {
    return;
  }

  const existingUser = await User.findOne({ email: configuredEmail });

  if (existingUser) {
    return;
  }

  const passwordHash = await hashPassword(configuredPassword);

  const adminUser = new User({
    email: configuredEmail,
    passwordHash,
    role: "ADMIN",
    active: true,
  });
  await adminUser.save();

  const adminAccount = new Account({
    userId: adminUser.id,
    holderName: extractHolderNameFromEmail(configuredEmail),
    active: true,
  });
  await adminAccount.save();

  await LedgerEntry.insertMany([
    {
      accountId: adminAccount.id,
      amount: INITIAL_CREDIT,
      type: "INITIAL_CREDIT",
    },
  ]);
}
