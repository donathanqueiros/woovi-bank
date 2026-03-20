jest.mock("../../AccountModel", () => {
  const Account = Object.assign(jest.fn(), {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  });

  return { Account };
});

jest.mock("../../../users/UserModel", () => {
  const User = Object.assign(jest.fn(), {
    deleteOne: jest.fn(),
  });

  return { User };
});

jest.mock("../../../sessions/sessionService", () => ({
  deleteSessionsByUserId: jest.fn(),
}));

jest.mock("../../../transactions/TransactionModel", () => {
  const Transaction = Object.assign(jest.fn(), {
    find: jest.fn(),
    deleteMany: jest.fn(),
  });

  return { Transaction };
});

jest.mock("../../../ledger/LedgerEntryModel", () => {
  const LedgerEntry = Object.assign(jest.fn(), {
    deleteMany: jest.fn(),
  });

  return { LedgerEntry };
});

jest.mock("../../../idempotency/IdempotencyRequestModel", () => {
  const IdempotencyRequest = Object.assign(jest.fn(), {
    deleteMany: jest.fn(),
  });

  return { IdempotencyRequest };
});

import mongoose from "mongoose";
import { executeGraphQL } from "../../../../__tests__/helpers/executeGraphQL";
import { createAccountDocument } from "../../../../__tests__/factories/createAccountDocument";
import { Account } from "../../AccountModel";
import { User } from "../../../users/UserModel";
import { deleteSessionsByUserId } from "../../../sessions/sessionService";
import { Transaction } from "../../../transactions/TransactionModel";
import { LedgerEntry } from "../../../ledger/LedgerEntryModel";
import { IdempotencyRequest } from "../../../idempotency/IdempotencyRequestModel";

const AccountModel = Account as unknown as {
  findOne: jest.Mock;
  deleteOne: jest.Mock;
};

const UserModel = User as unknown as {
  deleteOne: jest.Mock;
};

const sessionService = { deleteSessionsByUserId } as {
  deleteSessionsByUserId: jest.Mock;
};

const TransactionModel = Transaction as unknown as {
  find: jest.Mock;
  deleteMany: jest.Mock;
};

const LedgerEntryModel = LedgerEntry as unknown as {
  deleteMany: jest.Mock;
};

const IdempotencyRequestModel = IdempotencyRequest as unknown as {
  deleteMany: jest.Mock;
};

describe("DeleteUser mutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("anonimiza e desativa conta, revoga sessoes e remove usuario sem apagar historico financeiro", async () => {
    const account = createAccountDocument({
      id: "account-10",
      userId: "user-10",
      holderName: "Maria",
      active: true,
    });

    AccountModel.findOne.mockResolvedValue(account);
    AccountModel.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
    UserModel.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
    sessionService.deleteSessionsByUserId.mockResolvedValue(undefined);
    TransactionModel.find.mockReturnValue({
      distinct: jest.fn().mockResolvedValue(["transaction-1"]),
    });
    LedgerEntryModel.deleteMany.mockResolvedValue({ acknowledged: true, deletedCount: 2 });
    IdempotencyRequestModel.deleteMany.mockResolvedValue({
      acknowledged: true,
      deletedCount: 1,
    });
    TransactionModel.deleteMany.mockResolvedValue({
      acknowledged: true,
      deletedCount: 1,
    });

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
        DeleteUser(userId: "user-10")
      }
    `,
      {
        auth: {
          userId: "admin-1",
          role: "ADMIN",
        },
      },
    );

    expect(result.errors).toBeUndefined();
    expect(sessionService.deleteSessionsByUserId).toHaveBeenCalledTimes(1);
    expect(sessionService.deleteSessionsByUserId).toHaveBeenCalledWith(
      "user-10",
      expect.any(Object),
    );
    expect(account.save).toHaveBeenCalledWith(expect.any(Object));
    expect(account).toEqual(
      expect.objectContaining({
        active: false,
        userId: null,
        holderName: "Usuario removido",
        deletedByUserId: "admin-1",
      }),
    );
    expect(UserModel.deleteOne).toHaveBeenCalledWith(
      { _id: "user-10" },
      expect.any(Object),
    );
    expect(TransactionModel.deleteMany).not.toHaveBeenCalled();
    expect(LedgerEntryModel.deleteMany).not.toHaveBeenCalled();
    expect(IdempotencyRequestModel.deleteMany).not.toHaveBeenCalled();
    expect(result.data).toEqual({
      DeleteUser: true,
    });
    expect(endSession).toHaveBeenCalledTimes(1);
  });

  it("falha para usuario nao administrador", async () => {
    const result = await executeGraphQL(
      `
      mutation {
        DeleteUser(userId: "user-10")
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
      "Apenas administrador pode excluir usuario",
    );
    expect(AccountModel.findOne).not.toHaveBeenCalled();
  });

  it("falha quando conta do usuario nao existe", async () => {
    AccountModel.findOne.mockResolvedValue(null);

    const result = await executeGraphQL(
      `
      mutation {
        DeleteUser(userId: "missing-user")
      }
    `,
      {
        auth: {
          userId: "admin-1",
          role: "ADMIN",
        },
      },
    );

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain(
      "Conta do usuario nao encontrada",
    );
    expect(UserModel.deleteOne).not.toHaveBeenCalled();
    expect(sessionService.deleteSessionsByUserId).not.toHaveBeenCalled();
  });
});
