import { runWithOptionalTransaction } from "../../database/runWithOptionalTransaction";
import { Account } from "../accounts/AccountModel";
import { LedgerEntry } from "../ledger/LedgerEntryModel";
import { depositNotificationBus } from "../notifications/depositNotificationBus";
import { Transaction } from "../transactions/TransactionModel";
import { DepositRequest } from "./DepositRequestModel";
import { getWooviClient } from "./wooviClient";

const SYSTEM_DEPOSIT_ACCOUNT_HOLDER_NAME = "Sistema Depositos Woovi";
const DEPOSIT_EXTERNAL_REFERENCE_PREFIX = "WOOVI:CHARGE_COMPLETED:";
const DEPOSIT_TRANSACTION_DESCRIPTION = "Deposito via Woovi";

type ChargeCompletedPayload = {
  charge: {
    correlationID: string;
    value?: number;
  };
  pix?: {
    value?: string;
  };
};

type ChargeExpiredPayload = {
  charge: {
    correlationID: string;
  };
};

export type ChargeCompletedHandlingResult =
  | "processed"
  | "already-completed"
  | "not-found";

export type ChargeExpiredHandlingResult = "expired" | "already-expired" | "not-found";

function parsePaidAmount(payload: ChargeCompletedPayload) {
  const pixValue = Number(payload.pix?.value);

  if (Number.isFinite(pixValue) && pixValue > 0) {
    return pixValue;
  }

  const chargeValue = Number(payload.charge.value);

  if (Number.isFinite(chargeValue) && chargeValue > 0) {
    return chargeValue;
  }

  throw new Error("Valor pago invalido no webhook da Woovi");
}

function isMongoDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

async function getOrCreateSystemDepositAccount() {
  return await Account.findOneAndUpdate(
    {
      holderName: SYSTEM_DEPOSIT_ACCOUNT_HOLDER_NAME,
      userId: null,
    },
    {
      $setOnInsert: {
        holderName: SYSTEM_DEPOSIT_ACCOUNT_HOLDER_NAME,
        active: true,
      },
    },
    {
      upsert: true,
      new: true,
    },
  );
}

export async function handleWooviChargeCompletedEvent(
  payload: ChargeCompletedPayload,
): Promise<ChargeCompletedHandlingResult> {
  const correlationID = payload.charge.correlationID;

  if (!correlationID) {
    return "not-found";
  }

  const depositRequest = await DepositRequest.findOne({ correlationID });

  if (!depositRequest) {
    return "not-found";
  }

  if (depositRequest.status === "COMPLETED") {
    return "already-completed";
  }

  const paidAmount = parsePaidAmount(payload);
  const externalReference = `${DEPOSIT_EXTERNAL_REFERENCE_PREFIX}${correlationID}`;

  const existingTransaction = await Transaction.findOne({ externalReference });

  if (existingTransaction) {
    await DepositRequest.updateOne(
      { _id: depositRequest.id },
      {
        status: "COMPLETED",
        paidAmount,
        completedAt: new Date(),
      },
    );

    return "already-completed";
  }

  const beneficiaryAccount = await Account.findById(depositRequest.accountId);

  if (!beneficiaryAccount) {
    throw new Error("Conta de destino do deposito nao encontrada");
  }

  const systemAccount = await getOrCreateSystemDepositAccount();

  if (!systemAccount) {
    throw new Error("Falha ao criar conta tecnica de deposito");
  }

  let transaction: InstanceType<typeof Transaction> | null = null;
  const completedAt = new Date();

  try {
    await runWithOptionalTransaction(async (dbSession) => {
      const sessionOptions = dbSession ? { session: dbSession } : undefined;

      transaction = new Transaction({
        fromAccountId: systemAccount.id,
        toAccountId: String(depositRequest.accountId),
        amount: paidAmount,
        idempotencyKey: `deposit-${correlationID}`,
        externalReference,
        description: DEPOSIT_TRANSACTION_DESCRIPTION,
      });

      if (sessionOptions) {
        await transaction.save(sessionOptions);
      } else {
        await transaction.save();
      }

      const ledgerEntry = new LedgerEntry({
        accountId: String(depositRequest.accountId),
        transferId: transaction.id,
        amount: paidAmount,
        type: "CREDIT",
      });

      if (sessionOptions) {
        await ledgerEntry.save(sessionOptions);
      } else {
        await ledgerEntry.save();
      }

      await DepositRequest.updateOne(
        { _id: depositRequest.id },
        {
          status: "COMPLETED",
          paidAmount,
          completedAt,
        },
        sessionOptions,
      );
    });
  } catch (error) {
    if (!isMongoDuplicateKeyError(error)) {
      throw error;
    }

    await DepositRequest.updateOne(
      { _id: depositRequest.id },
      {
        status: "COMPLETED",
        paidAmount,
        completedAt,
      },
    );

    return "already-completed";
  }

  if (!transaction) {
    throw new Error("Falha ao registrar transacao de deposito");
  }

  depositNotificationBus.publishDepositConfirmed({
    depositId: String(depositRequest.id),
    accountId: String(depositRequest.accountId),
    correlationID,
    amount: paidAmount,
    createdAt: new Date(depositRequest.createdAt).toISOString(),
    completedAt: completedAt.toISOString(),
  });

  return "processed";
}

export async function handleWooviChargeExpiredEvent(
  payload: ChargeExpiredPayload,
): Promise<ChargeExpiredHandlingResult> {
  const correlationID = payload.charge.correlationID;

  if (!correlationID) {
    return "not-found";
  }

  const depositRequest = await DepositRequest.findOne({ correlationID });

  if (!depositRequest) {
    return "not-found";
  }

  if (depositRequest.status === "EXPIRED" || depositRequest.status === "COMPLETED") {
    return "already-expired";
  }

  await DepositRequest.updateOne(
    { _id: depositRequest.id },
    {
      status: "EXPIRED",
      expiredAt: new Date(),
    },
  );

  return "expired";
}

let cachedWebhookHandler: ReturnType<ReturnType<typeof getWooviClient>["webhook"]["handler"]> | null = null;

function getWooviWebhookHandler() {
  if (cachedWebhookHandler) {
    return cachedWebhookHandler;
  }

  const woovi = getWooviClient();

  cachedWebhookHandler = woovi.webhook.handler({
    onChargeCompleted: async (payload) => {
      await handleWooviChargeCompletedEvent(payload);
      return undefined;
    },
    onChargeExpired: async (payload) => {
      await handleWooviChargeExpiredEvent(payload);
      return undefined;
    },
    onChargeCreated: async () => undefined,
    onTransactionReceived: async () => undefined,
    onTransactionRefundReceived: async () => undefined,
    onMovementConfirmed: async () => undefined,
    onMovementFailed: async () => undefined,
    onMovementRemoved: async () => undefined,
  });

  return cachedWebhookHandler;
}

export async function handleWooviWebhookRequest(request: Request) {
  const handler = getWooviWebhookHandler();
  const response = await handler.POST(request);

  if (response.status === 404) {
    // eslint-disable-next-line no-console
    console.warn("Evento de webhook Woovi nao mapeado, retornando 200");

    return new Response("", { status: 200 });
  }

  return response;
}
