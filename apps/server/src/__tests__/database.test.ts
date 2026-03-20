jest.mock("mongoose", () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    connection: {
      on: jest.fn(),
    },
  },
}));

jest.mock("../modules/ledger/LedgerEntryModel", () => ({
  LedgerEntry: {
    syncIndexes: jest.fn(),
  },
}));

jest.mock("../modules/users/ensureConfiguredAdmin", () => ({
  ensureConfiguredAdmin: jest.fn(),
}));

import mongoose from "mongoose";
import { connectDatabase } from "../database";
import { LedgerEntry } from "../modules/ledger/LedgerEntryModel";
import { ensureConfiguredAdmin } from "../modules/users/ensureConfiguredAdmin";

const mongooseMock = mongoose as unknown as {
  connect: jest.Mock;
  connection: {
    on: jest.Mock;
  };
};

const LedgerEntryModel = LedgerEntry as unknown as {
  syncIndexes: jest.Mock;
};

const ensureConfiguredAdminMock = ensureConfiguredAdmin as jest.Mock;

describe("connectDatabase", () => {
  it("sincroniza os indices do ledger e garante o admin configurado ao conectar", async () => {
    mongooseMock.connect.mockResolvedValue(undefined);
    LedgerEntryModel.syncIndexes.mockResolvedValue(undefined);
    ensureConfiguredAdminMock.mockResolvedValue(undefined);

    await connectDatabase();

    expect(mongooseMock.connect).toHaveBeenCalledTimes(1);
    expect(LedgerEntryModel.syncIndexes).toHaveBeenCalledTimes(1);
    expect(ensureConfiguredAdminMock).toHaveBeenCalledTimes(1);
  });
});
