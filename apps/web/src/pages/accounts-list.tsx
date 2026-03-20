import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Landmark, Loader2, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      <section className="rounded-[22px] border border-border/70 bg-card px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Mapa de contas
            </Badge>
            <h1>Contas cadastradas</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Busque titulares, acompanhe datas de abertura e leia valores com mais escaneabilidade.
            </p>
          </div>
          <div className="grid min-w-56 gap-3 rounded-[20px] border border-border/70 bg-background/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Panorama
            </p>
            <p className="text-2xl font-semibold tracking-[-0.04em]">{totalCount}</p>
            <p className="text-sm text-muted-foreground">contas registradas no ambiente</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[22px] border border-border/70 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome do titular..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Pagina {page} de {totalPages}
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Carregando contas...</span>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {!loading && !error && filteredAccounts.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border bg-background/60 px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhuma conta encontrada para este filtro.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajuste a busca para localizar outro titular.
            </p>
          </div>
        ) : null}

        {!loading && !error && filteredAccounts.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {filteredAccounts.map((account) => (
              <article
                key={account.id}
                className="rounded-[20px] border border-border/70 bg-background/80 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-[0_18px_38px_-30px_color-mix(in_oklab,var(--foreground)_16%,transparent)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <User className="size-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{account.holderName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{account.id}</p>
                    </div>
                  </div>

                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    <Landmark className="mr-1 size-3.5" />
                    Conta
                  </Badge>
                </div>

                <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Saldo atual
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                      {formatBalance(account.balance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    {formatDate(account.createdAt)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Navegacao da lista
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
      </section>
    </div>
  );
}
