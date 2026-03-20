import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, SendHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatBalance, newIdempotencyKey } from "@/lib/formatters";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/use-auth";

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
  balance: number;
};

export default function TransferPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("100");
  const [transferDescription, setTransferDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await graphqlRequest<{ accounts: Account[] }>(ACCOUNTS_QUERY, {
        page: 1,
        limit: 100,
      });
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

  async function handleTransfer() {
    if (!user) return;
    if (!transferTo) {
      setFeedback("Escolha uma conta de destino.");
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      await graphqlRequest(TRANSFER_MUTATION, {
        fromAccountId: user.accountId,
        toAccountId: transferTo,
        amount: Number(transferAmount),
        idempotencyKey: newIdempotencyKey(),
        description: transferDescription || undefined,
      });

      setFeedback("Transferencia enviada com sucesso.");
      setTransferDescription("");
      await loadAccounts();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Falha na transferencia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-border/70 bg-card px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Acao principal
            </Badge>
            <h1>Transferencias</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Envie dinheiro entre contas com leitura clara de saldo e destino.
            </p>
          </div>
          <div className="rounded-[20px] border border-border/70 bg-background/80 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Saldo disponivel
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {formatBalance(myAccount?.balance ?? 0)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[24px] border border-border/70 bg-card p-6">
          <div className="space-y-2">
            <h2>Novo envio</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Preencha os dados abaixo para mover valor entre contas cadastradas.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              <span>Conta de destino</span>
              <Select value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                <option value="">Selecione uma conta</option>
                {otherAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.holderName} ({acc.id.slice(0, 8)})
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              <span>Valor (R$)</span>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              <span>Descricao</span>
              <Input
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                placeholder="Motivo ou contexto da transferencia"
              />
            </label>
          </div>

          {feedback ? (
            <p className="mt-4 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground">
              {feedback}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <Button onClick={() => void handleTransfer()} disabled={loading}>
              <SendHorizontal className="mr-2 size-4" />
              {loading ? "Transferindo..." : "Transferir agora"}
            </Button>
          </div>
        </article>

        <article className="rounded-[24px] border border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <h2 className="text-lg">Boas praticas</h2>
              <p className="text-sm text-muted-foreground">
                Reduza erros antes de confirmar o envio.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
              <p className="text-sm font-medium">Confira o destino</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Identifique a contraparte pelo nome e pelos primeiros caracteres do ID.
              </p>
            </div>
            <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
              <p className="text-sm font-medium">Evite valores sem contexto</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Use a descricao para facilitar rastreabilidade em auditoria e historico.
              </p>
            </div>
            <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
              <p className="text-sm font-medium">Saldo visivel antes da acao</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                O painel destaca seu saldo para apoiar decisoes sem mudar de tela.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
