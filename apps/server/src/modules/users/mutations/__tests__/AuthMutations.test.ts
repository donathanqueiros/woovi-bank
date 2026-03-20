jest.mock("../../../users/UserModel", () => {
  const User = Object.assign(jest.fn(), {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
  });

  return { User };
});

jest.mock("../../../accounts/AccountModel", () => {
  const Account = Object.assign(jest.fn(), {
    findById: jest.fn(),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
  });

  return { Account };
});

jest.mock("../../../ledger/LedgerEntryModel", () => {
  const LedgerEntry = Object.assign(jest.fn(), {
    aggregate: jest.fn(),
    insertMany: jest.fn(),
    deleteMany: jest.fn(),
  });

  return { LedgerEntry };
});

jest.mock("../../../sessions/SessionModel", () => {
  const Session = {
    create: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  return { Session };
});

import { executeGraphQL } from "../../../../__tests__/helpers/executeGraphQL";
import mongoose from "mongoose";
import { User } from "../../../users/UserModel";
import { Account } from "../../../accounts/AccountModel";
import { LedgerEntry } from "../../../ledger/LedgerEntryModel";
import { Session } from "../../../sessions/SessionModel";
import { hashPassword } from "../../../users/password";

const UserModel = User as unknown as jest.Mock & {
  findById: jest.Mock;
  findOne: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

const AccountModel = Account as unknown as jest.Mock & {
  findById: jest.Mock;
  findOne: jest.Mock;
  findOneAndDelete: jest.Mock;
};

const LedgerEntryModel = LedgerEntry as unknown as jest.Mock & {
  aggregate: jest.Mock;
  insertMany: jest.Mock;
  deleteMany: jest.Mock;
};

const SessionModel = Session as unknown as {
  create: jest.Mock;
  findOne: jest.Mock;
  deleteOne: jest.Mock;
};

describe("Auth mutations", () => {
  afterEach(() => {
    delete process.env.ADM_EMAIL;
    delete process.env.ADM_PASSWORD;
  });

  it("cria usuario com conta inicial de 1000", async () => {
    const setSessionCookie = jest.fn();
    const endSession = jest.fn();
    const userDoc = {
      id: "user-1",
      email: "ana@subli.com",
      role: "USER",
      active: true,
      save: jest.fn().mockResolvedValue(undefined),
    };

    const accountDoc = {
      id: "account-1",
      userId: "user-1",
      holderName: "ana",
      active: true,
      save: jest.fn().mockResolvedValue(undefined),
    };

    UserModel.findOne.mockResolvedValue(null);
    UserModel.mockImplementation(() => userDoc);
    AccountModel.mockImplementation(() => accountDoc);
    LedgerEntryModel.insertMany.mockResolvedValue(undefined);
    jest.spyOn(mongoose, "startSession").mockResolvedValue({
      withTransaction: async (callback: () => Promise<void>) => {
        await callback();
      },
      endSession,
    } as never);
    SessionModel.create.mockResolvedValue({
      token: "session-token-1",
      userId: "user-1",
      role: "USER",
      expiresAt: new Date("2026-12-31T00:00:00.000Z"),
    });

    const result = await executeGraphQL(
      `
      mutation {
        SignUp(email: "ana@subli.com", password: "StrongPass123") {
          user {
            id
            email
            role
            active
          }
          account {
            id
            holderName
          }
        }
      }
    `,
      {
        requestContext: {
          setSessionCookie,
          clearSessionCookie: jest.fn(),
        },
      },
    );

    expect(result.errors).toBeUndefined();
    expect(UserModel.findOne).toHaveBeenCalledWith({ email: "ana@subli.com" });
    expect(UserModel).toHaveBeenCalled();
    expect(AccountModel).toHaveBeenCalledWith({
      userId: "user-1",
      holderName: "ana",
      active: true,
    });
    expect(LedgerEntryModel.insertMany).toHaveBeenCalledTimes(1);
    expect(SessionModel.create).toHaveBeenCalledTimes(1);
    expect(endSession).toHaveBeenCalledTimes(1);
    expect(setSessionCookie).toHaveBeenCalledWith(
      "session-token-1",
      new Date("2026-12-31T00:00:00.000Z"),
    );
    expect(result.data).toEqual({
      SignUp: {
        user: {
          id: "user-1",
          email: "ana@subli.com",
          role: "USER",
          active: true,
        },
        account: {
          id: "account-1",
          holderName: "ana",
        },
      },
    });
  });

  it("mantem signup como usuario mesmo quando o email bate com o admin configurado", async () => {
    process.env.ADM_EMAIL = "admin@subli.com";
    process.env.ADM_PASSWORD = "StrongPass123";
    const setSessionCookie = jest.fn();
    const endSession = jest.fn();
    const userDoc = {
      id: "user-admin",
      email: "admin@subli.com",
      role: "USER",
      active: true,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const accountDoc = {
      id: "account-admin",
      userId: "user-admin",
      holderName: "admin",
      active: true,
      save: jest.fn().mockResolvedValue(undefined),
    };

    UserModel.findOne.mockResolvedValue(null);
    UserModel.mockImplementation(() => userDoc);
    AccountModel.mockImplementation(() => accountDoc);
    LedgerEntryModel.insertMany.mockResolvedValue(undefined);
    jest.spyOn(mongoose, "startSession").mockResolvedValue({
      withTransaction: async (callback: () => Promise<void>) => {
        await callback();
      },
      endSession,
    } as never);
    SessionModel.create.mockResolvedValue({
      token: "session-token-admin",
      userId: "user-admin",
      role: "USER",
      expiresAt: new Date("2026-12-31T00:00:00.000Z"),
    });

    const result = await executeGraphQL(
      `
        mutation {
          SignUp(email: "admin@subli.com", password: "StrongPass123") {
            user {
              id
              email
              role
            }
          }
        }
      `,
      {
        requestContext: {
          setSessionCookie,
          clearSessionCookie: jest.fn(),
        },
      },
    );

    expect(result.errors).toBeUndefined();
    expect(UserModel).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "USER",
      }),
    );
    expect(SessionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "USER",
      }),
    );
    expect(endSession).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual({
      SignUp: {
        user: {
          id: "user-admin",
          email: "admin@subli.com",
          role: "USER",
        },
      },
    });
  });

  it("faz signup sem transacao quando o Mongo nao suporta replica set", async () => {
    const setSessionCookie = jest.fn();
    const endSession = jest.fn();
    const userDoc = {
      id: "user-standalone",
      email: "solo@subli.com",
      role: "USER",
      active: true,
      save: jest.fn().mockResolvedValue(undefined),
    };

    const accountDoc = {
      id: "account-standalone",
      userId: "user-standalone",
      holderName: "solo",
      active: true,
      save: jest.fn().mockResolvedValue(undefined),
    };

    UserModel.findOne.mockResolvedValue(null);
    UserModel.mockImplementation(() => userDoc);
    AccountModel.mockImplementation(() => accountDoc);
    LedgerEntryModel.insertMany.mockResolvedValue(undefined);
    jest.spyOn(mongoose, "startSession").mockResolvedValue({
      withTransaction: jest
        .fn()
        .mockRejectedValue(
          new Error(
            "Transaction numbers are only allowed on a replica set member or mongos",
          ),
        ),
      endSession,
    } as never);
    SessionModel.create.mockResolvedValue({
      token: "session-token-standalone",
      userId: "user-standalone",
      role: "USER",
      expiresAt: new Date("2026-12-31T00:00:00.000Z"),
    });

    const result = await executeGraphQL(
      `
        mutation {
          SignUp(email: "solo@subli.com", password: "StrongPass123") {
            user {
              id
              email
            }
            account {
              id
              holderName
            }
          }
        }
      `,
      {
        requestContext: {
          setSessionCookie,
          clearSessionCookie: jest.fn(),
        },
      },
    );

    expect(result.errors).toBeUndefined();
    expect(userDoc.save).toHaveBeenCalledWith();
    expect(accountDoc.save).toHaveBeenCalledWith();
    expect(LedgerEntryModel.insertMany).toHaveBeenCalledWith(
      [
        {
          accountId: "account-standalone",
          amount: 1000,
          type: "INITIAL_CREDIT",
        },
      ],
    );
    expect(endSession).toHaveBeenCalledTimes(1);
    expect(setSessionCookie).toHaveBeenCalledWith(
      "session-token-standalone",
      new Date("2026-12-31T00:00:00.000Z"),
    );
    expect(result.data).toEqual({
      SignUp: {
        user: {
          id: "user-standalone",
          email: "solo@subli.com",
        },
        account: {
          id: "account-standalone",
          holderName: "solo",
        },
      },
    });
  });

  it("cria sessao e cookie no login", async () => {
    const setSessionCookie = jest.fn();

    UserModel.findOne.mockResolvedValue({
      id: "user-1",
      email: "ana@subli.com",
      passwordHash: await hashPassword("StrongPass123"),
      role: "USER",
      active: true,
    });
    AccountModel.findOne.mockResolvedValue({
      id: "account-1",
      userId: "user-1",
      holderName: "ana",
      balance: 1000,
      active: true,
    });
    SessionModel.create.mockResolvedValue({
      token: "session-token-login",
      userId: "user-1",
      role: "USER",
      expiresAt: new Date("2026-12-31T00:00:00.000Z"),
    });

    const result = await executeGraphQL(
      `
        mutation {
          Login(email: "ana@subli.com", password: "StrongPass123") {
            user {
              id
              email
              role
            }
            account {
              id
            }
          }
        }
      `,
      {
        requestContext: {
          setSessionCookie,
          clearSessionCookie: jest.fn(),
        },
      },
    );

    expect(result.errors).toBeUndefined();
    expect(SessionModel.create).toHaveBeenCalledTimes(1);
    expect(setSessionCookie).toHaveBeenCalledWith(
      "session-token-login",
      new Date("2026-12-31T00:00:00.000Z"),
    );
    expect(result.data).toEqual({
      Login: {
        user: {
          id: "user-1",
          email: "ana@subli.com",
          role: "USER",
        },
        account: {
          id: "account-1",
        },
      },
    });
  });

  it("encerra a sessao no logout", async () => {
    const clearSessionCookie = jest.fn();
    SessionModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await executeGraphQL(
      `
        mutation {
          Logout
        }
      `,
      {
        auth: {
          userId: "user-1",
          role: "USER",
        },
        sessionToken: "session-token-login",
        requestContext: {
          setSessionCookie: jest.fn(),
          clearSessionCookie,
        },
      },
    );

    expect(result.errors).toBeUndefined();
    expect(SessionModel.deleteOne).toHaveBeenCalledWith({
      token: "session-token-login",
    });
    expect(clearSessionCookie).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual({
      Logout: true,
    });
  });

  it("retorna usuario autenticado em me", async () => {
    UserModel.findById.mockResolvedValue({
      id: "user-1",
      email: "ana@subli.com",
      role: "USER",
      active: true,
    });

    const result = await executeGraphQL(
      `
        query {
          me {
            id
            email
            role
            active
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
    expect(UserModel.findById).toHaveBeenCalledWith("user-1");
    expect(result.data).toEqual({
      me: {
        id: "user-1",
        email: "ana@subli.com",
        role: "USER",
        active: true,
      },
    });
  });
});
