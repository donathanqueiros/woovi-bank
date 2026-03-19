"use client";

import { useEffect, useState } from "react";
import { Search, User, DollarSign, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GRAPHQL_URL = "http://localhost:4000/graphql";

type Account = {
  id: string;
  holderName: string;
  balance: number;
  createdAt: string;
};

async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query {
          accounts {
            id
            holderName
            balance
            createdAt
          }
        }
      `,
    }),
  });

  if (!res.ok) throw new Error("Falha ao conectar com o servidor");

  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);

  return json.data.accounts as Account[];
}

function formatBalance(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(isoString: string) {
  const ts = Number(isoString);
  const date = Number.isFinite(ts) ? new Date(ts) : new Date(isoString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAccounts()
      .then(setAccounts)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = accounts.filter((acc) =>
    acc.holderName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Busque e visualize as contas cadastradas no sistema.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome do titular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm",
              "outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-all"
            )}
          />
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">Carregando contas...</span>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-sm text-muted-foreground">
            {search
              ? `Nenhuma conta encontrada para "${search}".`
              : "Nenhuma conta cadastrada."}
          </div>
        )}

        {/* Account cards */}
        {!loading && !error && filtered.length > 0 && (
          <ul className="space-y-3">
            {filtered.map((account) => (
              <li
                key={account.id}
                className="rounded-xl border border-border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {account.holderName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground font-mono">
                        {account.id}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
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

        {/* Footer count */}
        {!loading && !error && accounts.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {filtered.length} de {accounts.length} conta
            {accounts.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Refresh button */}
        {!loading && !error && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchAccounts()
                  .then(setAccounts)
                  .catch((err: unknown) => {
                    setError(
                      err instanceof Error ? err.message : "Erro desconhecido"
                    );
                  })
                  .finally(() => setLoading(false));
              }}
            >
              Atualizar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
