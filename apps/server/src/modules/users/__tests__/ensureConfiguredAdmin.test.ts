jest.mock("../UserModel", () => {
  const User = Object.assign(jest.fn(), {
    findOne: jest.fn(),
  });

  return { User };
});

jest.mock("../../accounts/AccountModel", () => {
  const Account = Object.assign(jest.fn(), {});

  return { Account };
});

jest.mock("../../ledger/LedgerEntryModel", () => ({
  LedgerEntry: {
    insertMany: jest.fn(),
  },
}));

import { Account } from "../../accounts/AccountModel";
import { LedgerEntry } from "../../ledger/LedgerEntryModel";
import { ensureConfiguredAdmin } from "../ensureConfiguredAdmin";
import { User } from "../UserModel";
import * as passwordModule from "../password";

const UserModel = User as unknown as jest.Mock & {
  findOne: jest.Mock;
};

const AccountModel = Account as unknown as jest.Mock;

const LedgerEntryModel = LedgerEntry as unknown as {
  insertMany: jest.Mock;
};

describe("ensureConfiguredAdmin", () => {
  afterEach(() => {
    delete process.env.ADM_EMAIL;
    delete process.env.ADM_PASSWORD;
  });

  it("cria um unico admin com conta a partir do env quando ainda nao existe", async () => {
    process.env.ADM_EMAIL = "Admin@Woovi.com ";
    process.env.ADM_PASSWORD = "StrongPass123";

    const userDoc = {
      id: "admin-user-1",
      save: jest.fn().mockResolvedValue(undefined),
    };
    const accountDoc = {
      id: "admin-account-1",
      save: jest.fn().mockResolvedValue(undefined),
    };

    UserModel.findOne.mockResolvedValue(null);
    UserModel.mockImplementation(() => userDoc);
    AccountModel.mockImplementation(() => accountDoc);
    jest
      .spyOn(passwordModule, "hashPassword")
      .mockResolvedValue("hashed-password");
    LedgerEntryModel.insertMany.mockResolvedValue(undefined);

    await ensureConfiguredAdmin();

    expect(UserModel.findOne).toHaveBeenCalledWith({
      email: "admin@woovi.com",
    });
    expect(passwordModule.hashPassword).toHaveBeenCalledWith("StrongPass123");
    expect(UserModel).toHaveBeenCalledWith({
      email: "admin@woovi.com",
      passwordHash: "hashed-password",
      role: "ADMIN",
      active: true,
    });
    expect(userDoc.save).toHaveBeenCalledWith();
    expect(AccountModel).toHaveBeenCalledWith({
      userId: "admin-user-1",
      holderName: "admin",
      active: true,
    });
    expect(accountDoc.save).toHaveBeenCalledWith();
    expect(LedgerEntryModel.insertMany).toHaveBeenCalledWith([
      {
        accountId: "admin-account-1",
        amount: 1000,
        type: "INITIAL_CREDIT",
      },
    ]);
  });

  it("nao cria outro admin quando o usuario configurado ja existe", async () => {
    process.env.ADM_EMAIL = "admin@woovi.com";
    process.env.ADM_PASSWORD = "StrongPass123";

    UserModel.findOne.mockResolvedValue({
      id: "admin-user-1",
    });

    await ensureConfiguredAdmin();

    expect(UserModel).not.toHaveBeenCalled();
    expect(AccountModel).not.toHaveBeenCalled();
    expect(LedgerEntryModel.insertMany).not.toHaveBeenCalled();
  });
});
