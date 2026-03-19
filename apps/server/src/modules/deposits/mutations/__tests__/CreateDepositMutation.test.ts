jest.mock("../../../accounts/AccountModel", () => {
  const Account = Object.assign(jest.fn(), {
    findOne: jest.fn(),
  });

  return { Account };
});

jest.mock("../../DepositRequestModel", () => {
  const DepositRequest = Object.assign(jest.fn(), {
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
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

const DepositRequestModel = DepositRequest as unknown as jest.Mock;

const getWooviClientMock = getWooviClient as unknown as jest.Mock;

describe("CreateDeposit mutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retorna erro quando usuario nao esta autenticado", async () => {
    const result = await executeGraphQL(`
      mutation {
        CreateDeposit(amount: 100) {
          id
        }
      }
    `);

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain("Usuario nao autenticado");
  });

  it("retorna erro quando valor e invalido", async () => {
    const result = await executeGraphQL(
      `
      mutation {
        CreateDeposit(amount: 0) {
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
    expect(result.errors?.[0]?.message).toContain("Valor deve ser maior que zero");
  });

  it("retorna erro quando conta do usuario esta inativa", async () => {
    AccountModel.findOne.mockResolvedValue(
      createAccountDocument({ id: "account-1", userId: "user-1", active: false }),
    );

    const result = await executeGraphQL(
      `
      mutation {
        CreateDeposit(amount: 50) {
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
      "Deposito permitido apenas para conta ativa",
    );
  });

  it("cria deposito pendente e retorna dados do QR Code", async () => {
    AccountModel.findOne.mockResolvedValue(
      createAccountDocument({ id: "account-1", userId: "user-1", active: true }),
    );

    const chargeCreate = jest.fn().mockResolvedValue({
      charge: {
        correlationID: "corr-generated",
        value: 120,
        brCode: "000201...",
        qrCodeImage: "https://example.com/qr.png",
        expiresDate: "2026-03-20T12:00:00.000Z",
      },
    });

    getWooviClientMock.mockReturnValue({
      charge: {
        create: chargeCreate,
      },
    });

    const depositRequestDoc = {
      id: "deposit-1",
      accountId: "account-1",
      correlationID: "corr-generated",
      requestedAmount: 120,
      status: "PENDING",
      wooviChargeData: {
        brCode: "000201...",
        qrCodeImage: "https://example.com/qr.png",
        expiresDate: "2026-03-20T12:00:00.000Z",
      },
      createdAt: new Date("2026-03-19T12:00:00.000Z"),
      save: jest.fn().mockResolvedValue(undefined),
    };

    DepositRequestModel.mockImplementation(() => depositRequestDoc);

    const result = await executeGraphQL(
      `
      mutation {
        CreateDeposit(amount: 120, comment: "Top up") {
          id
          accountId
          correlationID
          requestedAmount
          status
          brCode
          qrCodeImage
          expiresDate
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
    expect(chargeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 120,
        comment: "Top up",
      }),
    );
    expect(DepositRequestModel).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "account-1",
        requestedAmount: 120,
        status: "PENDING",
        correlationID: expect.any(String),
        wooviChargeData: {
          brCode: "000201...",
          qrCodeImage: "https://example.com/qr.png",
          expiresDate: "2026-03-20T12:00:00.000Z",
        },
      }),
    );
    expect(result.data).toEqual({
      CreateDeposit: {
        id: "deposit-1",
        accountId: "account-1",
        correlationID: "corr-generated",
        requestedAmount: 120,
        status: "PENDING",
        brCode: "000201...",
        qrCodeImage: "https://example.com/qr.png",
        expiresDate: "2026-03-20T12:00:00.000Z",
      },
    });
  });

  it("retorna erro normalizado quando cliente da Woovi lanca objeto nao-Error", async () => {
    AccountModel.findOne.mockResolvedValue(
      createAccountDocument({ id: "account-1", userId: "user-1", active: true }),
    );

    getWooviClientMock.mockReturnValue({
      charge: {
        create: jest.fn().mockRejectedValue({
          data: null,
          errors: [{ message: "Falha ao criar cobranca" }],
        }),
      },
    });

    const result = await executeGraphQL(
      `
      mutation {
        CreateDeposit(amount: 120) {
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
    expect(result.errors?.[0]?.message).toContain("Falha ao criar cobranca");
    expect(result.errors?.[0]?.message).not.toContain("Unexpected error value");
  });
});
