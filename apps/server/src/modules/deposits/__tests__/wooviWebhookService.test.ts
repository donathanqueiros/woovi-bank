jest.mock("../../accounts/AccountModel", () => {
  const Account = Object.assign(jest.fn(), {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  });

  return { Account };
});

jest.mock("../../transactions/TransactionModel", () => {
  const Transaction = Object.assign(jest.fn(), {
    findOne: jest.fn(),
  });

  return { Transaction };
});

jest.mock("../../ledger/LedgerEntryModel", () => {
  const LedgerEntry = Object.assign(jest.fn(), {
    insertMany: jest.fn(),
  });

  return { LedgerEntry };
});

jest.mock("../DepositRequestModel", () => {
  const DepositRequest = Object.assign(jest.fn(), {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  });

  return { DepositRequest };
});

jest.mock("../../notifications/depositNotificationBus", () => ({
  depositNotificationBus: {
    publishDepositConfirmed: jest.fn(),
  },
}));

import mongoose from "mongoose";
import { createAccountDocument } from "../../../__tests__/factories/createAccountDocument";
import { createTransactionDocument } from "../../../__tests__/factories/createTransactionDocument";
import { Account } from "../../accounts/AccountModel";
import { LedgerEntry } from "../../ledger/LedgerEntryModel";
import { depositNotificationBus } from "../../notifications/depositNotificationBus";
import { Transaction } from "../../transactions/TransactionModel";
import { DepositRequest } from "../DepositRequestModel";
import {
  handleWooviChargeCompletedEvent,
  handleWooviChargeExpiredEvent,
} from "../wooviWebhookService";

const AccountModel = Account as unknown as {
  findById: jest.Mock;
  findOneAndUpdate: jest.Mock;
};

const TransactionModel = Transaction as unknown as jest.Mock & {
  findOne: jest.Mock;
};

const LedgerEntryModel = LedgerEntry as unknown as jest.Mock;

const DepositRequestModel = DepositRequest as unknown as {
  findOne: jest.Mock;
  updateOne: jest.Mock;
};

const DepositNotificationBus = depositNotificationBus as unknown as {
  publishDepositConfirmed: jest.Mock;
};

describe("wooviWebhookService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("processa charge completed e credita saldo uma unica vez", async () => {
    DepositRequestModel.findOne.mockResolvedValue({
      id: "deposit-1",
      accountId: "account-user-1",
      correlationID: "corr-1",
      status: "PENDING",
      requestedAmount: 150,
      createdAt: new Date("2026-03-19T10:00:00.000Z"),
    });

    AccountModel.findById.mockResolvedValue(
      createAccountDocument({
        id: "account-user-1",
        userId: "user-1",
        holderName: "Cliente",
      }),
    );
    AccountModel.findOneAndUpdate.mockResolvedValue(
      createAccountDocument({
        id: "account-system-1",
        holderName: "Sistema Depositos Woovi",
      }),
    );
    TransactionModel.findOne.mockResolvedValue(null);

    const transaction = createTransactionDocument({
      id: "transaction-deposit-1",
      fromAccountId: "account-system-1",
      toAccountId: "account-user-1",
      amount: 150,
      idempotencyKey: "deposit-corr-1",
      description: "Deposito via Woovi",
      createdAt: new Date("2026-03-19T10:10:00.000Z"),
    });
    TransactionModel.mockImplementation(() => transaction);

    const ledgerEntryDoc = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    LedgerEntryModel.mockImplementation(() => ledgerEntryDoc);

    DepositRequestModel.updateOne.mockResolvedValue({ acknowledged: true });

    const endSession = jest.fn();
    jest.spyOn(mongoose, "startSession").mockResolvedValue({
      withTransaction: async (callback: () => Promise<void>) => {
        await callback();
      },
      endSession,
    } as never);

    const result = await handleWooviChargeCompletedEvent({
      event: "OPENPIX:CHARGE_COMPLETED",
      charge: {
        correlationID: "corr-1",
      },
      pix: {
        value: "150",
      },
    } as never);

    expect(result).toBe("processed");
    expect(TransactionModel).toHaveBeenCalledWith({
      fromAccountId: "account-system-1",
      toAccountId: "account-user-1",
      amount: 150,
      idempotencyKey: "deposit-corr-1",
      externalReference: "WOOVI:CHARGE_COMPLETED:corr-1",
      description: "Deposito via Woovi",
    });
    expect(LedgerEntryModel).toHaveBeenCalledWith({
      accountId: "account-user-1",
      transferId: "transaction-deposit-1",
      amount: 150,
      type: "CREDIT",
    });
    expect(DepositRequestModel.updateOne).toHaveBeenCalledWith(
      { _id: "deposit-1" },
      expect.objectContaining({
        status: "COMPLETED",
        paidAmount: 150,
      }),
      expect.any(Object),
    );
    expect(DepositNotificationBus.publishDepositConfirmed).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "account-user-1",
        correlationID: "corr-1",
        amount: 150,
      }),
    );
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it("nao duplica credito quando deposito ja foi concluido", async () => {
    DepositRequestModel.findOne.mockResolvedValue({
      id: "deposit-1",
      accountId: "account-user-1",
      correlationID: "corr-1",
      status: "COMPLETED",
      paidAmount: 150,
    });

    const result = await handleWooviChargeCompletedEvent({
      event: "OPENPIX:CHARGE_COMPLETED",
      charge: {
        correlationID: "corr-1",
      },
      pix: {
        value: "150",
      },
    } as never);

    expect(result).toBe("already-completed");
    expect(TransactionModel).not.toHaveBeenCalled();
    expect(LedgerEntryModel).not.toHaveBeenCalled();
    expect(DepositNotificationBus.publishDepositConfirmed).not.toHaveBeenCalled();
  });

  it("ignora confirmacao quando o deposito ja foi cancelado", async () => {
    DepositRequestModel.findOne.mockResolvedValue({
      id: "deposit-1",
      accountId: "account-user-1",
      correlationID: "corr-1",
      status: "CANCELED",
      expiredAt: new Date("2026-03-19T10:05:00.000Z"),
    });

    const result = await handleWooviChargeCompletedEvent({
      event: "OPENPIX:CHARGE_COMPLETED",
      charge: {
        correlationID: "corr-1",
      },
      pix: {
        value: "150",
      },
    } as never);

    expect(result).toBe("already-closed");
    expect(TransactionModel).not.toHaveBeenCalled();
    expect(LedgerEntryModel).not.toHaveBeenCalled();
    expect(DepositNotificationBus.publishDepositConfirmed).not.toHaveBeenCalled();
  });

  it("marca deposito como expirado sem credito", async () => {
    DepositRequestModel.findOne.mockResolvedValue({
      id: "deposit-1",
      accountId: "account-user-1",
      correlationID: "corr-expired",
      status: "PENDING",
    });
    DepositRequestModel.updateOne.mockResolvedValue({ acknowledged: true });

    const result = await handleWooviChargeExpiredEvent({
      event: "OPENPIX:CHARGE_EXPIRED",
      charge: {
        correlationID: "corr-expired",
      },
    } as never);

    expect(result).toBe("expired");
    expect(DepositRequestModel.updateOne).toHaveBeenCalledWith(
      { _id: "deposit-1" },
      expect.objectContaining({ status: "EXPIRED" }),
    );
    expect(TransactionModel).not.toHaveBeenCalled();
    expect(LedgerEntryModel).not.toHaveBeenCalled();
    expect(DepositNotificationBus.publishDepositConfirmed).not.toHaveBeenCalled();
  });

  it("ignora correlationID desconhecido sem quebrar", async () => {
    DepositRequestModel.findOne.mockResolvedValue(null);

    const result = await handleWooviChargeCompletedEvent({
      event: "OPENPIX:CHARGE_COMPLETED",
      charge: {
        correlationID: "corr-unknown",
      },
      pix: {
        value: "80",
      },
    } as never);

    expect(result).toBe("not-found");
    expect(TransactionModel).not.toHaveBeenCalled();
    expect(LedgerEntryModel).not.toHaveBeenCalled();
    expect(DepositNotificationBus.publishDepositConfirmed).not.toHaveBeenCalled();
  });
});
