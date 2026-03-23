import { randomUUID } from "node:crypto";
import { GraphQLFloat, GraphQLNonNull, GraphQLString } from "graphql";
import { Account } from "../../accounts/AccountModel";
import { DepositRequest } from "../DepositRequestModel";
import { DepositRequestType } from "../DepositRequestType";
import { getWooviClient } from "../wooviClient";
import type { GraphQLContext } from "../../../types/auth";

function extractChargeData(charge: {
  brCode?: string;
  qrCodeImage?: string;
  expiresDate?: string;
  paymentMethods?: {
    pix?: {
      brCode?: string;
      qrCodeImage?: string;
    };
  };
}) {
  return {
    brCode: charge.brCode ?? charge.paymentMethods?.pix?.brCode,
    qrCodeImage: charge.qrCodeImage ?? charge.paymentMethods?.pix?.qrCodeImage,
    expiresDate: charge.expiresDate,
  };
}

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

  return new Error("Falha ao criar cobranca de deposito");
}

export const CreateDepositMutation = {
  type: new GraphQLNonNull(DepositRequestType),
  args: {
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    comment: { type: GraphQLString },
    expiresDate: { type: GraphQLString },
  },
  resolve: async (
    _source: unknown,
    {
      amount,
      comment,
      expiresDate,
    }: { amount: number; comment?: string; expiresDate?: string },
    context: GraphQLContext,
  ) => {
    if (!context.auth) {
      throw new Error("Usuario nao autenticado");
    }

    if (amount <= 0) {
      throw new Error("Valor deve ser maior que zero");
    }

    let normalizedExpiresDate: string | undefined;

    if (expiresDate) {
      const parsedExpiration = new Date(expiresDate);
      const minimumExpiration = Date.now() + 5 * 60 * 1000;

      if (
        Number.isNaN(parsedExpiration.getTime()) ||
        parsedExpiration.getTime() < minimumExpiration
      ) {
        throw new Error("Vencimento do deposito invalido");
      }

      normalizedExpiresDate = parsedExpiration.toISOString();
    }

    const account = await Account.findOne({ userId: context.auth.userId });

    if (!account) {
      throw new Error("Conta do usuario nao encontrada");
    }

    if (!account.active) {
      throw new Error("Deposito permitido apenas para conta ativa");
    }

    const correlationID = randomUUID();
    const woovi = getWooviClient();

    let createChargeResponse;

    try {
      createChargeResponse = await woovi.charge.create({
        correlationID,
        value: amount * 100, // Convertendo para centavos
        customer: {
          name: account.holderName,
          taxID: "12345678909",
        },
        ...(comment?.trim() ? { comment: comment.trim() } : {}),
        ...(normalizedExpiresDate ? { expiresDate: normalizedExpiresDate } : {}),
      });
    } catch (error) {
      throw normalizeUnknownError(error);
    }

    const charge = createChargeResponse.charge;
    const finalCorrelationID = charge.correlationID ?? correlationID;

    const depositRequest = new DepositRequest({
      accountId: account.id,
      correlationID: finalCorrelationID,
      requestedAmount: amount,
      status: "PENDING",
      wooviChargeData: extractChargeData(charge),
      ...(comment?.trim() ? { comment: comment.trim() } : {}),
    });

    await depositRequest.save();

    return depositRequest;
  },
};
