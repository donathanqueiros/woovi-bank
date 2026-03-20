jest.mock("../../modules/accounts/AccountModel", () => {
  const Account = Object.assign(jest.fn(), {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  });

  return { Account };
});

jest.mock("../../modules/transactions/TransactionModel", () => {
  const Transaction = Object.assign(jest.fn(), {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  });

  return { Transaction };
});

jest.mock("../../modules/ledger/LedgerEntryModel", () => {
  const LedgerEntry = {
    aggregate: jest.fn(),
  };

  return { LedgerEntry };
});

jest.mock("../../modules/users/UserModel", () => {
  const User = Object.assign(jest.fn(), {
    findById: jest.fn(),
  });

  return { User };
});

jest.mock("../../modules/kyc/KycModel", () => {
  const Kyc = {
    findOne: jest.fn(),
  };

  return { Kyc };
});

import { createAccountDocument } from "../../__tests__/factories/createAccountDocument";
import { createTransactionDocument } from "../../__tests__/factories/createTransactionDocument";
import { executeGraphQL } from "../../__tests__/helpers/executeGraphQL";
import { Account } from "../../modules/accounts/AccountModel";
import { LedgerEntry } from "../../modules/ledger/LedgerEntryModel";
import { Transaction } from "../../modules/transactions/TransactionModel";
import { User } from "../../modules/users/UserModel";
import { Kyc } from "../../modules/kyc/KycModel";

const KycModel = Kyc as unknown as {
  findOne: jest.Mock;
};

const AccountModel = Account as unknown as jest.Mock & {
  find: jest.Mock;
  findById: jest.Mock;
  findOne: jest.Mock;
  countDocuments: jest.Mock;
};

const TransactionModel = Transaction as unknown as jest.Mock & {
  find: jest.Mock;
  findById: jest.Mock;
  countDocuments: jest.Mock;
};

const LedgerEntryModel = LedgerEntry as unknown as {
  aggregate: jest.Mock;
};

const UserModel = User as unknown as jest.Mock & {
  findById: jest.Mock;
};

describe("QueryType", () => {
  it("retorna total de contas para paginação", async () => {
    AccountModel.countDocuments.mockResolvedValue(23);

    const result = await executeGraphQL(`
      query {
        accountsCount
      }
    `);

    expect(result.errors).toBeUndefined();
    expect(AccountModel.countDocuments).toHaveBeenCalledWith({});
    expect(result.data).toEqual({
      accountsCount: 23,
    });
  });

  it("lista contas paginadas com page e limit", async () => {
    AccountModel.find.mockResolvedValue([
      createAccountDocument({ id: "account-11", holderName: "Lucas" }),
      createAccountDocument({ id: "account-12", holderName: "Paula" }),
    ]);
    LedgerEntryModel.aggregate
      .mockResolvedValueOnce([{ balance: 85 }])
      .mockResolvedValueOnce([{ balance: 150 }]);

    const result = await executeGraphQL(`
      query {
        accounts(page: 2, limit: 2) {
          id
          holderName
          balance
        }
      }
    `);

    expect(result.errors).toBeUndefined();
    expect(AccountModel.find).toHaveBeenCalledWith(
      {},
      null,
      { limit: 2, skip: 2, sort: { createdAt: -1 } },
    );
    expect(LedgerEntryModel.aggregate).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({
      accounts: [
        { id: "account-11", holderName: "Lucas", balance: 85 },
        { id: "account-12", holderName: "Paula", balance: 150 },
      ],
    });
  });

  it("lista contas pelo root query", async () => {
    AccountModel.find.mockResolvedValue([
      createAccountDocument({ id: "account-1", holderName: "Joao" }),
      createAccountDocument({ id: "account-2", holderName: "Maria" }),
    ]);
    LedgerEntryModel.aggregate
      .mockResolvedValueOnce([{ balance: 130 }])
      .mockResolvedValueOnce([{ balance: 40 }]);

    const result = await executeGraphQL(`
      query {
        accounts {
          id
          holderName
          balance
        }
      }
    `);

    expect(result.errors).toBeUndefined();
    expect(AccountModel.find).toHaveBeenCalledTimes(1);
    expect(LedgerEntryModel.aggregate).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({
      accounts: [
        { id: "account-1", holderName: "Joao", balance: 130 },
        { id: "account-2", holderName: "Maria", balance: 40 },
      ],
    });
  });

  it("retorna me com accountId quando autenticado", async () => {
    UserModel.findById.mockResolvedValue({
      id: "user-1",
      email: "ana@woovi.com",
      role: "USER",
      active: true,
    });
    AccountModel.findOne.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
    });

    const result = await executeGraphQL(
      `
        query {
          me {
            id
            email
            role
            active
            accountId
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
    expect(result.data).toEqual({
      me: {
        id: "user-1",
        email: "ana@woovi.com",
        role: "USER",
        active: true,
        accountId: "account-1",
      },
    });
  });

  it("busca uma transacao pelo id", async () => {
    TransactionModel.findById.mockResolvedValue(
      createTransactionDocument({
        id: "transaction-9",
        amount: 300,
        description: "TED",
      }),
    );

    const result = await executeGraphQL(`
      query {
        transaction(id: "transaction-9") {
          id
          amount
          description
        }
      }
    `);

    expect(result.errors).toBeUndefined();
    expect(TransactionModel.findById).toHaveBeenCalledWith("transaction-9");
    expect(result.data).toEqual({
      transaction: {
        id: "transaction-9",
        amount: 300,
        description: "TED",
      },
    });
  });

  it("lista transacoes paginadas com page e limit", async () => {
    TransactionModel.find.mockResolvedValue([
      createTransactionDocument({
        id: "transaction-3",
        amount: 90,
        description: "Pix",
      }),
    ]);

    const result = await executeGraphQL(`
      query {
        transactions(page: 3, limit: 1) {
          id
          amount
          description
        }
      }
    `);

    expect(result.errors).toBeUndefined();
    expect(TransactionModel.find).toHaveBeenCalledWith(
      {},
      null,
      { limit: 1, skip: 2, sort: { createdAt: -1 } },
    );
    expect(result.data).toEqual({
      transactions: [
        {
          id: "transaction-3",
          amount: 90,
          description: "Pix",
        },
      ],
    });
  });

  it("retorna total de transacoes por conta para paginação", async () => {
    TransactionModel.countDocuments.mockResolvedValue(14);

    const result = await executeGraphQL(`
      query {
        transactionsCount(accountId: "account-1")
      }
    `);

    expect(result.errors).toBeUndefined();
    expect(TransactionModel.countDocuments).toHaveBeenCalledWith({
      $or: [
        { fromAccountId: "account-1" },
        { toAccountId: "account-1" },
      ],
    });
    expect(result.data).toEqual({
      transactionsCount: 14,
    });
  });

  it("retorna myKyc para usuario autenticado", async () => {
    KycModel.findOne.mockResolvedValue({
      id: "kyc-1",
      status: "UNDER_REVIEW",
      submittedAt: new Date("2026-01-01T00:00:00.000Z"),
      personalInfo: { fullName: "Ana Lima" },
    });

    const result = await executeGraphQL(
      `
        query {
          myKyc {
            id
            status
          }
        }
      `,
      { auth: { userId: "user-1", role: "USER" } },
    );

    expect(result.errors).toBeUndefined();
    expect(KycModel.findOne).toHaveBeenCalledWith({ userId: "user-1" });
    expect(result.data).toEqual({
      myKyc: { id: "kyc-1", status: "UNDER_REVIEW" },
    });
  });

  it("retorna null para myKyc quando nao autenticado", async () => {
    const result = await executeGraphQL(`
      query {
        myKyc {
          id
          status
        }
      }
    `);

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ myKyc: null });
    expect(KycModel.findOne).not.toHaveBeenCalled();
  });

  it("me.kycStatus retorna APPROVED para admin", async () => {
    UserModel.findById.mockResolvedValue({
      id: "admin-1",
      email: "admin@woovi.com",
      role: "ADMIN",
      active: true,
    });
    AccountModel.findOne.mockResolvedValue(null);

    const result = await executeGraphQL(
      `
        query {
          me {
            id
            kycStatus
          }
        }
      `,
      { auth: { userId: "admin-1", role: "ADMIN" } },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      me: { id: "admin-1", kycStatus: "APPROVED" },
    });
    expect(KycModel.findOne).not.toHaveBeenCalled();
  });

  it("me.kycStatus retorna PENDING_SUBMISSION quando usuario nao tem KYC", async () => {
    UserModel.findById.mockResolvedValue({
      id: "user-2",
      email: "novo@woovi.com",
      role: "USER",
      active: true,
    });
    AccountModel.findOne.mockResolvedValue(null);
    KycModel.findOne.mockResolvedValue(null);

    const result = await executeGraphQL(
      `
        query {
          me {
            id
            kycStatus
          }
        }
      `,
      { auth: { userId: "user-2", role: "USER" } },
    );

    expect(result.errors).toBeUndefined();
    expect(KycModel.findOne).toHaveBeenCalledWith({ userId: "user-2" });
    expect(result.data).toEqual({
      me: { id: "user-2", kycStatus: "PENDING_SUBMISSION" },
    });
  });

  it("me.kycStatus retorna status do KYC existente", async () => {
    UserModel.findById.mockResolvedValue({
      id: "user-3",
      email: "aprovado@woovi.com",
      role: "USER",
      active: true,
    });
    AccountModel.findOne.mockResolvedValue(null);
    KycModel.findOne.mockResolvedValue({ status: "APPROVED" });

    const result = await executeGraphQL(
      `
        query {
          me {
            id
            kycStatus
          }
        }
      `,
      { auth: { userId: "user-3", role: "USER" } },
    );

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      me: { id: "user-3", kycStatus: "APPROVED" },
    });
  });
});