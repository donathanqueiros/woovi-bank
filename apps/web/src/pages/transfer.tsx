import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  SendHorizontal,
  ShieldCheck,
  Wallet2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatBalance, newIdempotencyKey } from "@/lib/formatters";
import { graphqlRequest } from "@/lib/graphqlClient";
import { getTransferValidationMessage } from "@/lib/transfer-validation";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const ACCOUNTS_QUERY = `
  query TransferPageAccounts($page: Int!, $limit: Int!) {
    accounts(page: $page, limit: $limit) {
      id
      holderName
      balance
    }
  }
`;

const TRANSFER_MUTATION = `
  mutation Transfer($fromAccountId: String!, $toAccountId: String!, $amount: Float!, $idempotencyKey: String!, $description: String) {
    Transfer(
      fromAccountId: $fromAccountId
      toAccountId: $toAccountId
      amount: $amount
      idempotencyKey: $idempotencyKey
      description: $description
    ) {
      id
      amount
      createdAt
    }
  }
`;

type Account = {
  id: string;
  holderName: string;
  balance: number | null;
};

export default function TransferPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("100");
  const [transferDescription, setTransferDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"error" | "success">(
    "success",
  );

  const loadAccounts = useCallback(async () => {
    try {
      const data = await graphqlRequest<{ accounts: Account[] }>(
        ACCOUNTS_QUERY,
        {
          page: 1,
          limit: 100,
        },
      );
      setAccounts(data.accounts ?? []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const myAccount = useMemo(
    () => accounts.find((acc) => acc.id === user?.accountId) ?? null,
    [accounts, user?.accountId],
  );

  const otherAccounts = useMemo(
    () => accounts.filter((acc) => acc.id !== user?.accountId),
    [accounts, user?.accountId],
  );
  const hasKnownRecipients = otherAccounts.length > 0;
  const hasSelectedDestination = transferTo.trim().length > 0;
  const transferAmountError = useMemo(
    () =>
      getTransferValidationMessage({
        amount: transferAmount,
        balance: myAccount?.balance,
      }),
    [myAccount?.balance, transferAmount],
  );

  async function handleTransfer() {
    if (!user) return;
    const destinationAccountId = transferTo.trim();

    if (!destinationAccountId) {
      setFeedbackTone("error");
      setFeedback("Informe a conta de destino.");
      return;
    }

    if (transferAmountError) {
      setFeedbackTone("error");
      setFeedback(transferAmountError);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      await graphqlRequest(TRANSFER_MUTATION, {
        fromAccountId: user.accountId,
        toAccountId: destinationAccountId,
        amount: Number(transferAmount),
        idempotencyKey: newIdempotencyKey(),
        description: transferDescription || undefined,
      });

      setFeedbackTone("success");
      setFeedback("Transferencia enviada com sucesso.");
      setTransferTo("");
      setTransferDescription("");
      await loadAccounts();
    } catch (err) {
      setFeedbackTone("error");
      setFeedback(
        err instanceof Error ? err.message : "Falha na transferencia",
      );
    } finally {
      setLoading(false);
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
                  {formatBalance(myAccount?.balance ?? 0)}
                </p>
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-11">
              <Wallet2 className="size-5" />
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[28px] border border-border/70 bg-card p-5 shadow-[0_24px_48px_-36px_color-mix(in_oklab,var(--foreground)_16%,transparent)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Novo envio
              </Badge>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                Preencha e confirme
              </h2>
            </div>
            <div className="flex size-12 items-center justify-center rounded-[18px] bg-primary/10 text-primary sm:size-14 sm:rounded-[20px]">
              <ArrowRightLeft className="size-5 sm:size-6" />
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2 text-sm font-medium">
              <span>Conta de destino</span>
              {hasKnownRecipients ? (
                <Select
                  value={transferTo}
                  onChange={(e) => {
                    setTransferTo(e.target.value);

                    if (feedbackTone === "success") {
                      setFeedback(null);
                    }
                  }}
                >
                  <option value="">Selecione uma conta</option>
                  {otherAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.holderName} ({acc.id.slice(0, 8)})
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={transferTo}
                  onChange={(e) => {
                    setTransferTo(e.target.value);

                    if (feedbackTone === "success") {
                      setFeedback(null);
                    }
                  }}
                  placeholder="Cole o ID da conta de destino"
                />
              )}
              <p className="text-xs leading-5 text-muted-foreground">
                {hasKnownRecipients
                  ? "Selecione um destinatario salvo para acelerar a transferencia com menos digitacao."
                  : "Sem contas conhecidas nesta sessao. Informe manualmente o identificador da conta de destino."}
              </p>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <span>Valor (R$)</span>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={transferAmount}
                  onChange={(e) => {
                    setTransferAmount(e.target.value);

                    if (feedbackTone === "success") {
                      setFeedback(null);
                    }
                  }}
                />
                {transferAmountError ? (
                  <p className="text-xs text-destructive">
                    {transferAmountError}
                  </p>
                ) : null}
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Descricao</span>
                <Input
                  value={transferDescription}
                  onChange={(e) => {
                    setTransferDescription(e.target.value);

                    if (feedbackTone === "success") {
                      setFeedback(null);
                    }
                  }}
                  placeholder="Ex.: reembolso, ajuste interno ou apoio operacional"
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  Ajuda a dar contexto no historico e facilita rastreabilidade.
                </p>
              </label>
            </div>
          </div>

          {!transferAmountError && feedback ? (
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "mt-5 rounded-2xl border px-4 py-3 text-sm",
                feedbackTone === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              {feedback}
            </p>
          ) : null}

          <div className="mt-6 flex">
            <Button
              className="w-full sm:w-auto sm:min-w-52"
              onClick={() => void handleTransfer()}
              disabled={
                loading ||
                !hasSelectedDestination ||
                Boolean(transferAmountError)
              }
            >
              <SendHorizontal className="size-4" />
              {loading ? "Transferindo..." : "Transferir agora"}
            </Button>
          </div>
        </article>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <article className="rounded-[24px] border border-border/70 bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-foreground">
                  Checklist rapido
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Um resumo curto para revisar o essencial antes de confirmar o
                  envio.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <div className="rounded-[18px] border border-border/70 bg-background/80 px-4 py-3">
                Confira se o destino corresponde ao titular esperado antes de
                enviar.
              </div>
              <div className="rounded-[18px] border border-border/70 bg-background/80 px-4 py-3">
                Evite valores sem descricao quando a operacao precisar de
                rastreabilidade.
              </div>
              <div className="rounded-[18px] border border-border/70 bg-background/80 px-4 py-3">
                Use o saldo destacado no topo para revisar o impacto antes da
                confirmacao.
              </div>
            </div>
          </article>

        </div>
      </section>
    </div>
  );
}
