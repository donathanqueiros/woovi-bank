import { useCallback, useEffect, useMemo, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transferencias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie dinheiro entre contas.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Transferir dinheiro</h2>
            <p className="text-xs text-slate-600">Envio entre contas cadastradas.</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-slate-500">Saldo disponivel</p>
            <p className="font-semibold">{formatBalance(myAccount?.balance ?? 0)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium">
            Destino
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
            >
              <option value="">Selecione uma conta</option>
              {otherAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.holderName} ({acc.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Valor (R$)
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              type="number"
              min={0.01}
              step="0.01"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </label>

          <label className="text-sm font-medium">
            Descricao (opcional)
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={transferDescription}
              onChange={(e) => setTransferDescription(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleTransfer()} disabled={loading}>
            <SendHorizontal className="mr-2 size-4" />
            {loading ? "Transferindo..." : "Transferir agora"}
          </Button>
          {feedback && (
            <p className="text-sm text-slate-700">{feedback}</p>
          )}
        </div>
      </div>
    </div>
  );
}
