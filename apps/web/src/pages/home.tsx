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
  const [feedbackTone, setFeedbackTone] = useState<"error" | "success">("success");

  const loadAccount = useCallback(async () => {
    if (!user?.accountId) {
      setAccount(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await graphqlRequest<{ account: Account | null }>(ACCOUNT_QUERY, {
        id: user.accountId,
      });
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

    window.addEventListener(ACCOUNT_TRANSFER_RECEIVED_EVENT, handleBalanceUpdate);
    window.addEventListener(ACCOUNT_DEPOSIT_CONFIRMED_EVENT, handleBalanceUpdate);

    return () => {
      window.removeEventListener(ACCOUNT_TRANSFER_RECEIVED_EVENT, handleBalanceUpdate);
      window.removeEventListener(ACCOUNT_DEPOSIT_CONFIRMED_EVENT, handleBalanceUpdate);
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
      setFeedback(err instanceof Error ? err.message : "Falha ao registrar recarga");
    } finally {
      setPurchaseLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_28px_60px_-40px_color-mix(in_oklab,var(--foreground)_18%,transparent)]">
        <div className="grid gap-6 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--secondary)_72%,white),transparent_48%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_70%,white),var(--card))] px-6 py-7 sm:px-8 sm:py-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div className="space-y-5">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Operacao central
            </Badge>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Home</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] text-foreground">
                Atalhos claros para transferir, depositar e registrar recargas sem sair do fluxo.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Seu saldo fica em destaque e as acoes principais aparecem em uma camada mais direta para o dia a dia.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate("/transfer")}>
                Transferir agora
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/deposit")}>
                Depositar via Pix
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-[24px] border border-border/70 bg-background/85 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wallet2 className="size-5" />
              </div>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Conta atual
              </Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Saldo disponivel
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">
                {loading ? "Carregando..." : formatBalance(account?.balance ?? 0)}
              </p>
            </div>
            <div className="rounded-[20px] border border-border/70 bg-card/90 p-4">
              <p className="text-sm font-medium text-foreground">
                {account?.holderName ?? user?.email ?? "Conta em carregamento"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                ID da conta: {account?.id ?? user?.accountId ?? "indisponivel"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <article className="rounded-[24px] border border-border/70 bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SendHorizontal className="size-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Transferir dinheiro</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Abra a tela de transferencia com o saldo em mente e envie valores entre contas.
                </p>
              </div>
            </div>
            <Button className="mt-5" onClick={() => navigate("/transfer")}>
              Ir para transferencias
            </Button>
          </article>

          <article className="rounded-[24px] border border-border/70 bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <QrCode className="size-5" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">Depositar via Pix</h2>
                  <Badge variant="outline">Pix apenas</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Gere um novo QR Code Pix e acompanhe as confirmacoes no fluxo dedicado de deposito.
                </p>
              </div>
            </div>
            <Button
              className="mt-5 border-cyan-200 bg-cyan-500 text-white shadow-[0_18px_36px_-22px_color-mix(in_oklab,#06b6d4_55%,transparent)] hover:border-cyan-300 hover:bg-cyan-400 hover:text-white"
              onClick={() => navigate("/deposit")}
            >
              Abrir deposito Pix
            </Button>
          </article>

          <article className="rounded-[24px] border border-border/70 bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Landmark className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Leitura operacional</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Use esta home como camada de decisao rapida e mantenha `Contas` e `Historico` para investigacao detalhada.
                </p>
              </div>
            </div>
          </article>
        </div>

        <article className="rounded-[28px] border border-border/70 bg-card p-6 shadow-[0_24px_48px_-36px_color-mix(in_oklab,var(--foreground)_16%,transparent)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Recarga simulada
              </Badge>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                Registrar credito de celular
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Escolha um valor fixo, informe o telefone no formato internacional e debite diretamente do saldo disponivel.
              </p>
            </div>
            <div className="flex size-14 items-center justify-center rounded-[20px] bg-primary/10 text-primary">
              <Smartphone className="size-6" />
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
              <p className="text-sm font-medium text-foreground">Valores disponiveis</p>
              <div className="flex flex-wrap gap-2">
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
                        "min-w-20 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-200",
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

            <div className="rounded-[22px] border border-border/70 bg-background/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Debito previsto
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">
                    {formatBalance(selectedAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Saldo atual
                  </p>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {formatBalance(account?.balance ?? 0)}
                  </p>
                </div>
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

            <div className="flex justify-end">
              <Button onClick={() => void handlePurchasePhoneCredit()} disabled={isSubmitDisabled}>
                {purchaseLoading ? "Registrando..." : "Registrar recarga"}
              </Button>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
