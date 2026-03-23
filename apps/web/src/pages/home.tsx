import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Landmark,
  QrCode,
  SendHorizontal,
  Smartphone,
  Wallet2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACCOUNT_DEPOSIT_CONFIRMED_EVENT,
  ACCOUNT_TRANSFER_RECEIVED_EVENT,
  dispatchAccountPhoneCreditPurchased,
} from "@/lib/account-notification-events";
import { formatBalance, newIdempotencyKey } from "@/lib/formatters";
import { graphqlRequest } from "@/lib/graphqlClient";
import {
  PHONE_CREDIT_AMOUNTS,
  getPhoneCreditValidationMessage,
} from "@/lib/phone-credit-validation";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const ACCOUNT_QUERY = `
  query HomeAccount($id: ID!) {
    account(id: $id) {
      id
      holderName
      balance
      createdAt
    }
  }
`;

const PURCHASE_PHONE_CREDIT_MUTATION = `
  mutation PurchasePhoneCredit($phone: String!, $amount: Float!, $idempotencyKey: String!) {
    PurchasePhoneCredit(phone: $phone, amount: $amount, idempotencyKey: $idempotencyKey) {
      id
      accountId
      phone
      amount
      status
      createdAt
    }
  }
`;

type Account = {
  id: string;
  holderName: string;
  balance: number | null;
  createdAt: string;
};

type PhoneCreditPurchase = {
  id: string;
  accountId: string;
  phone: string;
  amount: number;
  status: "RECORDED";
  createdAt: string;
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [phone, setPhone] = useState("");
  const [selectedAmount, setSelectedAmount] =
    useState<(typeof PHONE_CREDIT_AMOUNTS)[number]>(20);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"error" | "success">(
    "success",
  );

  const loadAccount = useCallback(async () => {
    if (!user?.accountId) {
      setAccount(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await graphqlRequest<{ account: Account | null }>(
        ACCOUNT_QUERY,
        {
          id: user.accountId,
        },
      );
      setAccount(data.account ?? null);
    } catch {
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, [user?.accountId]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBalanceUpdate = () => {
      void loadAccount();
    };

    window.addEventListener(
      ACCOUNT_TRANSFER_RECEIVED_EVENT,
      handleBalanceUpdate,
    );
    window.addEventListener(
      ACCOUNT_DEPOSIT_CONFIRMED_EVENT,
      handleBalanceUpdate,
    );

    return () => {
      window.removeEventListener(
        ACCOUNT_TRANSFER_RECEIVED_EVENT,
        handleBalanceUpdate,
      );
      window.removeEventListener(
        ACCOUNT_DEPOSIT_CONFIRMED_EVENT,
        handleBalanceUpdate,
      );
    };
  }, [loadAccount]);

  const validationMessage = useMemo(
    () =>
      getPhoneCreditValidationMessage({
        phone,
        amount: selectedAmount,
        balance: account?.balance,
      }),
    [account?.balance, phone, selectedAmount],
  );

  const isSubmitDisabled =
    purchaseLoading || loading || !phone.trim() || Boolean(validationMessage);

  async function handlePurchasePhoneCredit() {
    if (!user?.accountId || isSubmitDisabled) {
      return;
    }

    setPurchaseLoading(true);
    setFeedback(null);

    try {
      const data = await graphqlRequest<{
        PurchasePhoneCredit: PhoneCreditPurchase;
      }>(PURCHASE_PHONE_CREDIT_MUTATION, {
        phone: phone.trim(),
        amount: selectedAmount,
        idempotencyKey: newIdempotencyKey(),
      });

      setFeedbackTone("success");
      setFeedback("Recarga registrada com sucesso.");
      setPhone("");
      setSelectedAmount(20);
      dispatchAccountPhoneCreditPurchased(data.PurchasePhoneCredit);
      await loadAccount();
    } catch (err) {
      setFeedbackTone("error");
      setFeedback(
        err instanceof Error ? err.message : "Falha ao registrar recarga",
      );
    } finally {
      setPurchaseLoading(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <article className="order-1 grid gap-3 rounded-[24px] border border-border/70 bg-card p-4 shadow-[0_24px_48px_-36px_color-mix(in_oklab,var(--foreground)_16%,transparent)] sm:p-5 lg:order-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Conta atual
              </Badge>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
                  Saldo disponivel
                </p>
                <p className="mt-1.5 text-2xl font-semibold tracking-[-0.05em] text-foreground sm:text-[1.75rem]">
                  {loading
                    ? "Carregando..."
                    : formatBalance(account?.balance ?? 0)}
                </p>
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-11">
              <Wallet2 className="size-5" />
            </div>
          </div>
        </article>

        <div className="order-2 overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_28px_60px_-40px_color-mix(in_oklab,var(--foreground)_18%,transparent)] lg:order-1">
          <div className="space-y-5 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--secondary)_72%,white),transparent_48%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_70%,white),var(--card))] px-5 py-6 sm:px-6 sm:py-7">
            <div className="space-y-2">
              <h1 className="max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.05em] text-foreground sm:text-3xl">
                Opere rapido no dia a dia.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Transferencia, Pix e recarga com leitura direta da conta.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-[24px] border border-primary/15 bg-primary p-5 text-primary-foreground shadow-[0_22px_44px_-28px_color-mix(in_oklab,var(--primary)_60%,transparent)] sm:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
                      Transferir agora
                    </h2>
                    <p className="max-w-xl text-sm leading-6 text-primary-foreground/84">
                      Entre direto no fluxo de transferencia com o saldo atual
                      em mente.
                    </p>
                  </div>
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/14">
                    <SendHorizontal className="size-5" />
                  </div>
                </div>
                <Button
                  size="lg"
                  variant="secondary"
                  className="mt-5 w-full justify-between bg-white text-primary shadow-none hover:bg-white/92 sm:w-auto sm:min-w-56"
                  onClick={() => navigate("/transfer")}
                >
                  Transferir agora
                  <ArrowRight className="size-4" />
                </Button>
              </article>

              <article className="rounded-[24px] border border-border/70 bg-background/85 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-500/12 text-cyan-600">
                    <QrCode className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">
                        Depositar via Pix
                      </h2>
                      <Badge variant="outline" className="rounded-full">
                        Pix
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Gere um QR Code novo sem sair da leitura principal da
                      conta.
                    </p>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full text-white shadow-[0_18px_36px_-22px_color-mix(in_oklab,#06b6d4_55%,transparent)] hover:border-cyan-300 hover:bg-cyan-400 hover:text-white"
                  onClick={() => navigate("/deposit")}
                >
                  Abrir deposito Pix
                </Button>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[28px] border border-border/70 bg-card p-5 shadow-[0_24px_48px_-36px_color-mix(in_oklab,var(--foreground)_16%,transparent)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Recarga simulada
              </Badge>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                Registrar credito de celular
              </h2>
            </div>
            <div className="flex size-12 items-center justify-center rounded-[18px] bg-primary/10 text-primary sm:size-14 sm:rounded-[20px]">
              <Smartphone className="size-5 sm:size-6" />
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="space-y-2 text-sm font-medium">
              <span>Telefone</span>
              <Input
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  if (feedbackTone === "success") {
                    setFeedback(null);
                  }
                }}
                placeholder="+55 11 99999-9999"
                inputMode="tel"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                Aceitamos apenas o formato internacional, como `+5511999999999`.
              </p>
              {validationMessage ? (
                <p className="text-xs text-destructive">{validationMessage}</p>
              ) : null}
            </label>

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Valores disponiveis
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PHONE_CREDIT_AMOUNTS.map((amount) => {
                  const isActive = amount === selectedAmount;

                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        if (feedbackTone === "success") {
                          setFeedback(null);
                        }
                      }}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200",
                        isActive
                          ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_18px_34px_-24px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
                          : "border-border/70 bg-background text-foreground hover:border-primary/20 hover:bg-secondary/70",
                      )}
                    >
                      {formatBalance(amount)}
                    </button>
                  );
                })}
              </div>
            </div>

            {feedback ? (
              <p
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm",
                  feedbackTone === "error"
                    ? "border-destructive/30 bg-destructive/8 text-destructive"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700",
                )}
              >
                {feedback}
              </p>
            ) : null}

            <div className="flex">
              <Button
                className="w-full sm:w-auto sm:min-w-52"
                onClick={() => void handlePurchasePhoneCredit()}
                disabled={isSubmitDisabled}
              >
                {purchaseLoading ? "Registrando..." : "Registrar recarga"}
              </Button>
            </div>
          </div>
        </article>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <article className="rounded-[24px] border border-border/70 bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <QrCode className="size-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">
                  Deposito dedicado
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use a tela de deposito para acompanhar confirmacoes e validade
                  do QR Code.
                </p>
              </div>
            </div>
            <Button
              className="mt-4 w-full md:w-auto border-cyan-200  text-white shadow-[0_18px_36px_-22px_color-mix(in_oklab,#06b6d4_55%,transparent)] hover:border-cyan-300 hover:bg-cyan-400 hover:text-white"
              onClick={() => navigate("/deposit")}
            >
              Abrir deposito Pix
            </Button>
          </article>
        </div>
      </section>
    </div>
  );
}
