import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { requestSubscription, useRelayEnvironment } from "react-relay";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBalance, formatDateTime } from "@/lib/formatters";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/use-auth";
import subscriptionNode from "./__generated__/accountsTransferReceivedSubscription.graphql";
import type { accountsTransferReceivedSubscription } from "./__generated__/accountsTransferReceivedSubscription.graphql";

const PAGE_SIZE = 10;

const TRANSACTIONS_QUERY = `
  query TransactionsList($page: Int!, $limit: Int!, $accountId: ID) {
    transactionsCount(accountId: $accountId)
    transactions(page: $page, limit: $limit, accountId: $accountId) {
      id
      amount
      description
      createdAt
      fromAccount {
        id
        holderName
      }
      toAccount {
        id
        holderName
      }
    }
  }
`;

type Transaction = {
  id: string;
  amount: number;
  description?: string | null;
  createdAt: string;
  fromAccount: { id: string; holderName: string };
  toAccount: { id: string; holderName: string };
};

export default function TransactionsPage() {
  const relayEnvironment = useRelayEnvironment();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphqlRequest<{
        transactions: Transaction[];
        transactionsCount: number;
      }>(TRANSACTIONS_QUERY, {
        page,
        limit: PAGE_SIZE,
        accountId: user?.accountId,
      });
      setTransactions(data.transactions ?? []);
      setTotalCount(data.transactionsCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [page, user?.accountId]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  // Real-time subscription: reload when a transfer is received
  useEffect(() => {
    if (!user?.accountId) return;

    const subscription = requestSubscription<accountsTransferReceivedSubscription>(
      relayEnvironment,
      {
        subscription: subscriptionNode,
        variables: { accountId: user.accountId },
        onNext: (data) => {
          const payload = data?.transferReceived;
          if (!payload) return;

          toast.success(
            `Voce recebeu ${formatBalance(payload.amount)} de ${payload.fromAccountHolderName}`,
            {
              description: payload.description
                ? payload.description
                : `Transferencia em ${formatDateTime(payload.createdAt)}`,
            },
          );
          void loadTransactions();
        },
      },
    );

    return () => subscription.dispose();
  }, [loadTransactions, relayEnvironment, user?.accountId]);

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => Number(b.createdAt) - Number(a.createdAt) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt),
      ),
    [transactions],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transacoes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Extrato de entradas e saidas da sua conta.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Carregando transacoes...</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && sortedTransactions.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            Sem transacoes para exibir no momento.
          </p>
        )}

        {!loading && !error && sortedTransactions.length > 0 && (
          <ul className="space-y-2">
            {sortedTransactions.map((transaction) => {
              const outgoing = transaction.fromAccount.id === user?.accountId;
              const counterpart = outgoing
                ? transaction.toAccount.holderName
                : transaction.fromAccount.holderName;

              return (
                <li
                  key={transaction.id}
                  className="rounded-xl border border-border bg-background px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full",
                          outgoing
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {outgoing ? (
                          <ArrowUpRight className="size-4" />
                        ) : (
                          <ArrowDownLeft className="size-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">
                          {outgoing ? "Transferencia enviada" : "Transferencia recebida"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Conta: {counterpart}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          outgoing ? "text-rose-700" : "text-emerald-700",
                        )}
                      >
                        {outgoing ? "-" : "+"}
                        {formatBalance(transaction.amount)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                  </div>

                  {transaction.description && (
                    <p className="mt-2 text-xs text-slate-600">{transaction.description}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
          <p className="text-xs text-muted-foreground">
            Pagina {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Proxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
