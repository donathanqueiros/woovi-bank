jest.mock("../../../accounts/AccountModel", () => {
  const Account = Object.assign(jest.fn(), {
    findOne: jest.fn(),
  });

  return { Account };
});

jest.mock("../../DepositRequestModel", () => {
  const DepositRequest = Object.assign(jest.fn(), {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  });

  return { DepositRequest };
});

jest.mock("../../wooviClient", () => ({
  getWooviClient: jest.fn(),
}));

import { executeGraphQL } from "../../../../__tests__/helpers/executeGraphQL";
import { createAccountDocument } from "../../../../__tests__/factories/createAccountDocument";
import { Account } from "../../../accounts/AccountModel";
import { DepositRequest } from "../../DepositRequestModel";
import { getWooviClient } from "../../wooviClient";

const AccountModel = Account as unknown as {
  findOne: jest.Mock;
};

const DepositRequestModel = DepositRequest as unknown as {
  findOne: jest.Mock;
  updateOne: jest.Mock;
};

const getWooviClientMock = getWooviClient as unknown as jest.Mock;

describe("CancelLatestDeposit mutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna erro quando usuario nao esta autenticado", async () => {
    const result = await executeGraphQL(`
      mutation {
        CancelLatestDeposit {
          id
        }
      }
    `);

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain("Usuario nao autenticado");
  });

  it("retorna erro quando nao existe deposito pendente para cancelar", async () => {
    AccountModel.findOne.mockResolvedValue(
      createAccountDocument({ id: "account-1", userId: "user-1", active: true }),
    );
    DepositRequestModel.findOne.mockResolvedValue(null);

    const result = await executeGraphQL(
      `
      mutation {
        CancelLatestDeposit {
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
      "Nenhum deposito pendente para cancelar",
    );
  });

  it("cancela o deposito pendente mais recente", async () => {
    AccountModel.findOne.mockResolvedValue(
      createAccountDocument({ id: "account-1", userId: "user-1", active: true }),
    );

    const pendingDeposit = {
      id: "deposit-1",
      accountId: "account-1",
      correlationID: "corr-pending",
      requestedAmount: 120,
      status: "PENDING",
      wooviChargeData: {
        brCode: "000201...",
        qrCodeImage: "https://example.com/qr.png",
        expiresDate: "2026-03-20T12:00:00.000Z",
      },
      createdAt: new Date("2026-03-19T12:00:00.000Z"),
      expiredAt: null,
    };

    DepositRequestModel.findOne.mockResolvedValue(pendingDeposit);
    DepositRequestModel.updateOne.mockResolvedValue({ acknowledged: true });

    const chargeDelete = jest.fn().mockResolvedValue({ status: "OK" });
    getWooviClientMock.mockReturnValue({
      charge: {
        delete: chargeDelete,
      },
    });

    const result = await executeGraphQL(
      `
      mutation {
        CancelLatestDeposit {
          id
          correlationID
          status
          expiredAt
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
    expect(DepositRequestModel.findOne).toHaveBeenCalledWith(
      { accountId: "account-1", status: "PENDING" },
      null,
      { sort: { createdAt: -1 } },
    );
    expect(chargeDelete).toHaveBeenCalledWith({ id: "corr-pending" });
    expect(DepositRequestModel.updateOne).toHaveBeenCalledWith(
      { _id: "deposit-1" },
      expect.objectContaining({
        status: "CANCELED",
        expiredAt: expect.any(Date),
      }),
    );
    expect(result.data?.CancelLatestDeposit).toEqual({
      id: "deposit-1",
      correlationID: "corr-pending",
      status: "CANCELED",
      expiredAt: expect.any(String),
    });
  });
});
