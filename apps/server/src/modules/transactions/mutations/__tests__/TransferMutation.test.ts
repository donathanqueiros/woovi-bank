jest.mock("../../../accounts/AccountModel", () => {
  const Account = Object.assign(jest.fn(), {
    find: jest.fn(),
    findById: jest.fn(),
  });

  return { Account };
});

jest.mock("../../TransactionModel", () => {
  const Transaction = Object.assign(jest.fn(), {
    find: jest.fn(),
    findById: jest.fn(),
  });

  return { Transaction };
});

jest.mock("../../../idempotency/IdempotencyRequestModel", () => {
  const IdempotencyRequest = Object.assign(jest.fn(), {
    findOne: jest.fn(),
  });

  return { IdempotencyRequest };
});

jest.mock("../../../ledger/LedgerEntryModel", () => {
  const LedgerEntry = {
    aggregate: jest.fn(),
    insertMany: jest.fn(),
  };

  return { LedgerEntry };
});

jest.mock("../../../notifications/transferNotificationBus", () => ({
  transferNotificationBus: {
    publishTransferReceived: jest.fn(),
  },
}));

import { createAccountDocument } from "../../../../__tests__/factories/createAccountDocument";
import { createTransactionDocument } from "../../../../__tests__/factories/createTransactionDocument";
import { executeGraphQL } from "../../../../__tests__/helpers/executeGraphQL";
import { Account } from "../../../accounts/AccountModel";
import { Transaction } from "../../TransactionModel";
import { IdempotencyRequest } from "../../../idempotency/IdempotencyRequestModel";
import { LedgerEntry } from "../../../ledger/LedgerEntryModel";
import { transferNotificationBus } from "../../../notifications/transferNotificationBus";
import mongoose from "mongoose";

const AccountModel = Account as unknown as jest.Mock & {
  find: jest.Mock;
  findById: jest.Mock;
};

const TransactionModel = Transaction as unknown as jest.Mock & {
  find: jest.Mock;
  findById: jest.Mock;
};

const IdempotencyRequestModel = IdempotencyRequest as unknown as {
  new (...args: unknown[]): { save: jest.Mock };
  findOne: jest.Mock;
};

const LedgerEntryModel = LedgerEntry as unknown as {
  aggregate: jest.Mock;
  insertMany: jest.Mock;
};

const TransferNotificationBus = transferNotificationBus as unknown as {
  publishTransferReceived: jest.Mock;
};

describe("Transfer mutation", () => {
  it("falha quando tentativa de auto-transferencia", async () => {
    const result = await executeGraphQL(
      `
      mutation {
        Transfer(
          fromAccountId: "account-1"
          toAccountId: "account-1"
          amount: 120
          idempotencyKey: "idem-self"
        ) {
          id
        }
      }
    `,
      {
        auth: {
          userId: "user-1",
          role: "USER",
        },
      },
    );

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain(
      "Nao e permitido transferir para a mesma conta",
    );
    expect(AccountModel.findById).not.toHaveBeenCalled();
    expect(TransactionModel).not.toHaveBeenCalled();
  });

  it("transfere saldo entre contas e persiste a transacao", async () => {
    const fromAccount = createAccountDocument({
      id: "account-1",
      balance: 500,
      userId: "user-1",
    });
    const toAccount = createAccountDocument({
      id: "account-2",
      balance: 50,
      userId: "user-2",
    });
    const transaction = createTransactionDocument({
      fromAccountId: "account-1",
      toAccountId: "account-2",
      amount: 120,
      idempotencyKey: "idem-1",
      description: "Pagamento",
    });

    AccountModel.findById
      .mockResolvedValueOnce(fromAccount)
      .mockResolvedValueOnce(toAccount);
    IdempotencyRequestModel.findOne.mockResolvedValue(null);
    TransactionModel.mockImplementation(() => transaction);
    LedgerEntryModel.aggregate.mockResolvedValue([{ balance: 500 }]);
    LedgerEntryModel.insertMany.mockResolvedValue(undefined);
    const idempotencyRequestDoc = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    (IdempotencyRequest as unknown as jest.Mock).mockImplementation(
      () => idempotencyRequestDoc,
    );
    const endSession = jest.fn();
    jest.spyOn(mongoose, "startSession").mockResolvedValue({
      withTransaction: async (callback: () => Promise<void>) => {
        await callback();
      },
      endSession,
    } as never);

    const result = await executeGraphQL(
      `
      mutation {
        Transfer(
          fromAccountId: "account-1"
          toAccountId: "account-2"
          amount: 120
          idempotencyKey: "idem-1"
          description: "Pagamento"
        ) {
          id
          amount
          idempotencyKey
          description
        }
      }
    `,
      {
        auth: {
          userId: "user-1",
          role: "USER",
        },
      },
    );

    expect(result.errors).toBeUndefined();
    expect(LedgerEntryModel.aggregate).toHaveBeenCalledTimes(1);
    expect(fromAccount.save).not.toHaveBeenCalled();
    expect(toAccount.save).not.toHaveBeenCalled();
    expect(TransactionModel).toHaveBeenCalledWith({
      fromAccountId: "account-1",
      toAccountId: "account-2",
      amount: 120,
      idempotencyKey: "idem-1",
      description: "Pagamento",
    });
    expect(LedgerEntryModel.insertMany).toHaveBeenCalledTimes(1);
    expect(IdempotencyRequest).toHaveBeenCalledWith({
      accountId: "account-1",
      idempotencyKey: "idem-1",
      transferId: "transaction-1",
    });
    expect(idempotencyRequestDoc.save).toHaveBeenCalledWith(
      expect.any(Object),
    );
    expect(
      TransferNotificationBus.publishTransferReceived,
    ).toHaveBeenCalledWith({
      transactionId: "transaction-1",
      fromAccountId: "account-1",
      toAccountId: "account-2",
      amount: 120,
      description: "Pagamento",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(endSession).toHaveBeenCalledTimes(1);
    expect(transaction.save).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual({
      Transfer: {
        id: "transaction-1",
        amount: 120,
        idempotencyKey: "idem-1",
        description: "Pagamento",
      },
    });
  });

  it("falha rapido quando o valor da transferencia e invalido", async () => {
    const result = await executeGraphQL(
      `
      mutation {
        Transfer(
          fromAccountId: "account-1"
          toAccountId: "account-2"
          amount: 0
          idempotencyKey: "idem-invalid"
        ) {
          id
        }
      }
    `,
      {
        auth: {
          userId: "user-1",
          role: "USER",
        },
      },
    );

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain(
      "Valor deve ser maior que zero",
    );
    expect(AccountModel.findById).not.toHaveBeenCalled();
    expect(TransactionModel).not.toHaveBeenCalled();
  });

  it("retorna erro quando a conta de origem nao tem saldo suficiente", async () => {
    const fromAccount = createAccountDocument({
      id: "account-1",
      balance: 20,
      userId: "user-1",
    });
    const toAccount = createAccountDocument({
      id: "account-2",
      balance: 50,
      userId: "user-2",
    });

    AccountModel.findById
      .mockResolvedValueOnce(fromAccount)
      .mockResolvedValueOnce(toAccount);
    IdempotencyRequestModel.findOne.mockResolvedValue(null);
    LedgerEntryModel.aggregate.mockResolvedValue([{ balance: 20 }]);
    jest.spyOn(mongoose, "startSession").mockResolvedValue({
      withTransaction: async (callback: () => Promise<void>) => {
        await callback();
      },
      endSession: jest.fn(),
    } as never);

    const result = await executeGraphQL(
      `
      mutation {
        Transfer(
          fromAccountId: "account-1"
          toAccountId: "account-2"
          amount: 120
          idempotencyKey: "idem-insufficient"
        ) {
          id
        }
      }
    `,
      {
        auth: {
          userId: "user-1",
          role: "USER",
        },
      },
    );

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain("Saldo insuficiente");
    expect(fromAccount.save).not.toHaveBeenCalled();
    expect(toAccount.save).not.toHaveBeenCalled();
    expect(TransactionModel).not.toHaveBeenCalled();
  });
});