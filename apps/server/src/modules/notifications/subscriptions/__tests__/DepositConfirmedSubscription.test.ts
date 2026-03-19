jest.mock("../../../accounts/AccountModel", () => {
  const Account = Object.assign(jest.fn(), {
    findById: jest.fn(),
  });

  return { Account };
});

import { createAccountDocument } from "../../../../__tests__/factories/createAccountDocument";
import { Account } from "../../../accounts/AccountModel";
import { depositNotificationBus } from "../../depositNotificationBus";
import { DepositConfirmedSubscription } from "../DepositConfirmedSubscription";

const AccountModel = Account as unknown as {
  findById: jest.Mock;
};

describe("DepositConfirmedSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("bloqueia inscricao sem autenticacao", async () => {
    const iterator = DepositConfirmedSubscription.subscribe(
      undefined,
      { accountId: "account-1" },
      {},
    );

    await expect(iterator.next()).rejects.toThrow("Usuario nao autenticado");
  });

  it("bloqueia inscricao para conta de outro usuario", async () => {
    AccountModel.findById.mockResolvedValue(
      createAccountDocument({ id: "account-1", userId: "user-owner" }),
    );

    const iterator = DepositConfirmedSubscription.subscribe(
      undefined,
      { accountId: "account-1" },
      {
        auth: {
          userId: "user-other",
          role: "USER",
        },
      },
    );

    await expect(iterator.next()).rejects.toThrow(
      "Sem permissao para assinar notificacoes desta conta",
    );
  });

  it("entrega evento para usuario dono da conta", async () => {
    AccountModel.findById.mockResolvedValue(
      createAccountDocument({ id: "account-1", userId: "user-1" }),
    );

    const iterator = await DepositConfirmedSubscription.subscribe(
      undefined,
      { accountId: "account-1" },
      {
        auth: {
          userId: "user-1",
          role: "USER",
        },
      },
    );

    const payload = {
      depositId: "deposit-1",
      accountId: "account-1",
      correlationID: "corr-1",
      amount: 150,
      createdAt: "2026-03-19T10:00:00.000Z",
      completedAt: "2026-03-19T10:02:00.000Z",
    };

    const nextNotification = iterator.next();
    await new Promise<void>((resolve) => {
      setImmediate(() => {
        depositNotificationBus.publishDepositConfirmed(payload);
        resolve();
      });
    });

    const result = await nextNotification;

    expect(result.value).toEqual(payload);

    await iterator.return?.(undefined);
  });
});
