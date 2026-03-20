import { GraphQLNonNull, GraphQLString } from "graphql";
import { Account } from "../../accounts/AccountModel";
import { runWithOptionalTransaction } from "../../../database/runWithOptionalTransaction";
import { LedgerEntry } from "../../ledger/LedgerEntryModel";
import { createUserSession } from "../../sessions/sessionService";
import { AuthPayloadType } from "../AuthPayloadType";
import { User } from "../UserModel";
import { hashPassword } from "../password";
import type { GraphQLContext } from "../../../types/auth";

const INITIAL_CREDIT = 1000;

function extractHolderNameFromEmail(email: string) {
  return email.split("@")[0] ?? "Usuario";
}

export const SignUpMutation = {
  type: new GraphQLNonNull(AuthPayloadType),
  args: {
    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _source: unknown,
    { email, password }: { email: string; password: string },
    context: GraphQLContext,
  ) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      throw new Error("Email invalido");
    }

    if (password.length < 8) {
      throw new Error("Senha deve ter ao menos 8 caracteres");
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw new Error("Email ja cadastrado");
    }

    const passwordHash = await hashPassword(password);

    let createdUserId: string | null = null;
    let createdUserRole: "USER" | "ADMIN" | null = null;
    let createdAccountId: string | null = null;
    let user: { id: string; role: "USER" | "ADMIN" } | null = null;
    let account: { id: string } | null = null;

    await runWithOptionalTransaction(async (dbSession) => {
      const sessionOptions = dbSession ? { session: dbSession } : null;

        const createdUser = new User({
          email: normalizedEmail,
          passwordHash,
          role: "USER",
          active: true,
        });
        if (sessionOptions) {
          await createdUser.save(sessionOptions);
        } else {
          await createdUser.save();
        }
        user = createdUser;
        createdUserId = createdUser.id;
        createdUserRole = createdUser.role;

        const createdAccount = new Account({
          userId: createdUser.id,
          holderName: extractHolderNameFromEmail(normalizedEmail),
          active: true,
        });
        if (sessionOptions) {
          await createdAccount.save(sessionOptions);
        } else {
          await createdAccount.save();
        }
        account = createdAccount;
        createdAccountId = createdAccount.id;

      const ledgerEntries = [
        {
          accountId: createdAccount.id,
          amount: INITIAL_CREDIT,
          type: "INITIAL_CREDIT",
        },
      ];

      if (sessionOptions) {
        await LedgerEntry.insertMany(ledgerEntries, sessionOptions);
      } else {
        await LedgerEntry.insertMany(ledgerEntries);
      }
    });

    if (!user || !account || !createdUserId || !createdUserRole || !createdAccountId) {
      throw new Error("Falha ao criar usuario");
    }

    const userSession = await createUserSession({
      userId: createdUserId,
      role: createdUserRole,
    });

    const persistedUser = user as { id: string; role: "USER" | "ADMIN" } & Record<string, unknown>;
    const persistedAccount = account as { id: string } & Record<string, unknown>;

    context.requestContext?.setSessionCookie(
      userSession.token,
      userSession.expiresAt,
    );

    return {
      user: persistedUser,
      account: persistedAccount,
    };
  },
};
