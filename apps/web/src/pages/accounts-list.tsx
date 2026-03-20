import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, DollarSign, Loader2, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBalance, formatDate } from "@/lib/formatters";
import { graphqlRequest } from "@/lib/graphqlClient";

const PAGE_SIZE = 10;

const ACCOUNTS_QUERY = `
  query Accounts($page: Int!, $limit: Int!) {
    accountsCount
    accounts(page: $page, limit: $limit) {
      id
      holderName
      balance
      createdAt
    }
  }
`;

type Account = {
  id: string;
  holderName: string;
  balance: number;
  createdAt: string;
};

export default function AccountsListPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await graphqlRequest<{ accounts: Account[]; accountsCount: number }>(
        ACCOUNTS_QUERY,
        { page, limit: PAGE_SIZE },
      );
      setAccounts(data.accounts ?? []);
      setTotalCount(data.accountsCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((acc) =>
        acc.holderName.toLowerCase().includes(search.toLowerCase()),
      ),
    [accounts, search],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta e busca de contas cadastradas.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome do titular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm",
              "outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/30",
            )}
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Carregando contas...</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && filteredAccounts.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            Nenhuma conta encontrada para este filtro.
          </p>
        )}

        {!loading && !error && filteredAccounts.length > 0 && (
          <ul className="space-y-3">
            {filteredAccounts.map((account) => (
              <li
                key={account.id}
                className="rounded-xl border border-border bg-background p-4 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{account.holderName}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{account.id}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1 text-sm font-semibold">
                      <DollarSign className="size-3.5 text-muted-foreground" />
                      {formatBalance(account.balance)}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {formatDate(account.createdAt)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
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
