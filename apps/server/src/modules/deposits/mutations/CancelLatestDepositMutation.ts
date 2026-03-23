import { GraphQLNonNull } from "graphql";
import { Account } from "../../accounts/AccountModel";
import { DepositRequest } from "../DepositRequestModel";
import { DepositRequestType } from "../DepositRequestType";
import { getWooviClient } from "../wooviClient";
import type { GraphQLContext } from "../../../types/auth";

function normalizeUnknownError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "errors" in error &&
    Array.isArray((error as { errors?: unknown[] }).errors)
  ) {
    const firstError = (error as { errors: unknown[] }).errors[0];
    if (
      firstError &&
      typeof firstError === "object" &&
      "message" in firstError &&
      typeof (firstError as { message?: unknown }).message === "string"
    ) {
      return new Error((firstError as { message: string }).message);
    }
  }

  return new Error("Falha ao cancelar deposito");
}

export const CancelLatestDepositMutation = {
  type: new GraphQLNonNull(DepositRequestType),
  resolve: async (_source: unknown, _args: unknown, context: GraphQLContext) => {
    if (!context.auth) {
      throw new Error("Usuario nao autenticado");
    }

    const account = await Account.findOne({ userId: context.auth.userId });

    if (!account) {
      throw new Error("Conta do usuario nao encontrada");
    }

    const latestPendingDeposit = await DepositRequest.findOne(
      { accountId: account.id, status: "PENDING" },
      null,
      { sort: { createdAt: -1 } },
    );

    if (!latestPendingDeposit) {
      throw new Error("Nenhum deposito pendente para cancelar");
    }

    const woovi = getWooviClient();

    try {
      await woovi.charge.delete({ id: latestPendingDeposit.correlationID });
    } catch (error) {
      throw normalizeUnknownError(error);
    }

    const canceledAt = new Date();

    await DepositRequest.updateOne(
      { _id: latestPendingDeposit.id },
      {
        status: "CANCELED",
        expiredAt: canceledAt,
      },
    );

    latestPendingDeposit.status = "CANCELED";
    latestPendingDeposit.expiredAt = canceledAt;

    return latestPendingDeposit;
  },
};
