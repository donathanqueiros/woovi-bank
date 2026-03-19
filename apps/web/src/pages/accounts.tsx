"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Landmark,
  Loader2,
  Search,
  SendHorizontal,
  ShieldCheck,
  User,
} from "lucide-react";
import { fetchQuery, graphql, useRelayEnvironment } from "react-relay";
import { Button } from "@/components/ui/button";
import {
  DashboardSidebar,
  type SidebarItem,
} from "@/components/dashboard-sidebar";
import { cn } from "@/lib/utils";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/use-auth";
import type { accountsQuery } from "./__generated__/accountsQuery.graphql";

const PAGE_SIZE = 10;

const accountsPageQuery = graphql`
  query accountsQuery($page: Int!, $limit: Int!) {
    accounts(page: $page, limit: $limit) {
      id
      holderName
      balance
      createdAt
    }
  }
`;

type Account = NonNullable<accountsQuery["response"]["accounts"]>[number];

type TransactionsPayload = {
  transactions: Array<{
    id: string;
    amount: number;
    description?: string | null;
    createdAt: string;
    fromAccount: {
      id: string;
      holderName: string;
    };
    toAccount: {
      id: string;
      holderName: string;
    };
  }>;
};

const TRANSACTIONS_QUERY = `
  query Transactions($page: Int!, $limit: Int!, $accountId: ID) {
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

const ADD_CREDIT_MUTATION = `
  mutation AddCredit($accountId: String!, $amount: Float!, $idempotencyKey: String!) {
    AddCredit(accountId: $accountId, amount: $amount, idempotencyKey: $idempotencyKey) {
      id
      balance
    }
  }
`;

const DELETE_USER_MUTATION = `
  mutation DeleteUser($userId: String!) {
    DeleteUser(userId: $userId)
  }
`;

const LOGOUT_MUTATION = `
  mutation Logout {
    Logout
  }
`;

function formatBalance(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseDateValue(value: string) {
  const ts = Number(value);
  return Number.isFinite(ts) ? ts : Date.parse(value);
}

function formatDate(isoString: string) {
  const date = new Date(parseDateValue(isoString));

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(isoString: string) {
  const date = new Date(parseDateValue(isoString));

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function newIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AccountsPage() {
  const relayEnvironment = useRelayEnvironment();
  const { user, logout } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<TransactionsPayload["transactions"]>([]);
  const [search, setSearch] = useState("");
  const [accountsPage, setAccountsPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [hasMoreAccounts, setHasMoreAccounts] = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("100");
  const [transferDescription, setTransferDescription] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);
  const [creditAccountId, setCreditAccountId] = useState("");
  const [creditAmount, setCreditAmount] = useState("100");
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [activeItemId, setActiveItemId] = useState("contas");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const myAccount = useMemo(
    () => accounts.find((account) => account.id === user?.accountId) ?? null,
    [accounts, user?.accountId],
  );

  const sidebarItems = useMemo<SidebarItem[]>(() => {
    const items: SidebarItem[] = [
      {
        id: "contas",
        label: "Contas",
        description: "Busca e consulta de saldos",
        icon: Landmark,
      },
      {
        id: "transacoes",
        label: "Transacoes",
        description: "Extrato das movimentacoes",
        icon: ArrowRightLeft,
      },
      {
        id: "transferencias",
        label: "Transferencias",
        description: "Envio de dinheiro entre contas",
        icon: SendHorizontal,
      },
      {
        id: "perfil",
        label: "Perfil",
        description: "Sessao e seguranca",
        icon: User,
      },
    ];

    if (user?.role === "ADMIN") {
      items.push({
        id: "administracao",
        label: "Administracao",
        description: "Credito e exclusao de usuarios",
        icon: ShieldCheck,
      });
    }

    return items;
  }, [user?.role]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [accountsData, transactionsData] = await Promise.all([
        fetchQuery<accountsQuery>(relayEnvironment, accountsPageQuery, {
          page: accountsPage,
          limit: PAGE_SIZE,
        }).toPromise(),
        graphqlRequest<TransactionsPayload>(TRANSACTIONS_QUERY, {
          page: transactionsPage,
          limit: PAGE_SIZE,
          accountId: user?.accountId,
        }),
      ]);

      if (!accountsData) {
        throw new Error("Resposta vazia do servidor");
      }

      const nextAccounts = [...accountsData.accounts];
      const nextTransactions = transactionsData.transactions ?? [];

      setAccounts(nextAccounts);
      setTransactions(nextTransactions);
      setHasMoreAccounts(nextAccounts.length === PAGE_SIZE);
      setHasMoreTransactions(nextTransactions.length === PAGE_SIZE);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [accountsPage, relayEnvironment, transactionsPage, user?.accountId]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    setAccountsPage(1);
  }, [search]);

  useEffect(() => {
    if (myAccount && !creditAccountId) {
      setCreditAccountId(myAccount.id);
    }
  }, [creditAccountId, myAccount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);

        if (visibleEntry?.target?.id) {
          setActiveItemId(visibleEntry.target.id);
        }
      },
      {
        threshold: 0.3,
        rootMargin: "-20% 0px -60% 0px",
      },
    );

    sidebarItems.forEach((item) => {
      const element = document.getElementById(item.id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sidebarItems]);

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) =>
        account.holderName.toLowerCase().includes(search.toLowerCase()),
      ),
    [accounts, search],
  );

  const accountTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) =>
          parseDateValue(b.createdAt) - parseDateValue(a.createdAt),
      ),
    [transactions],
  );

  const navigateToSection = useCallback((id: string) => {
    setActiveItemId(id);

    const element = document.getElementById(id);

    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  async function handleTransfer() {
    if (!user) {
      return;
    }

    if (!transferTo) {
      setTransferFeedback("Escolha uma conta de destino.");
      return;
    }

    setTransferLoading(true);
    setTransferFeedback(null);

    try {
      await graphqlRequest(TRANSFER_MUTATION, {
        fromAccountId: user.accountId,
        toAccountId: transferTo,
        amount: Number(transferAmount),
        idempotencyKey: newIdempotencyKey(),
        description: transferDescription || undefined,
      });

      setTransferFeedback("Transferencia enviada com sucesso.");
      setTransferDescription("");
      await loadDashboardData();
    } catch (err: unknown) {
      setTransferFeedback(err instanceof Error ? err.message : "Falha na transferencia");
    } finally {
      setTransferLoading(false);
    }
  }

  async function handleAddCredit() {
    setAdminLoading(true);
    setAdminFeedback(null);

    try {
      await graphqlRequest(ADD_CREDIT_MUTATION, {
        accountId: creditAccountId,
        amount: Number(creditAmount),
        idempotencyKey: newIdempotencyKey(),
      });

      setAdminFeedback("Credito adicionado com sucesso.");
      await loadDashboardData();
    } catch (err: unknown) {
      setAdminFeedback(err instanceof Error ? err.message : "Falha ao adicionar credito");
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserId) {
      setAdminFeedback("Informe o ID do usuario para excluir.");
      return;
    }

    setAdminLoading(true);
    setAdminFeedback(null);

    try {
      await graphqlRequest(DELETE_USER_MUTATION, { userId: deleteUserId });
      setAdminFeedback("Usuario excluido com sucesso.");
      setDeleteUserId("");
      await loadDashboardData();
    } catch (err: unknown) {
      setAdminFeedback(err instanceof Error ? err.message : "Falha ao excluir usuario");
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await graphqlRequest(LOGOUT_MUTATION, {});
    } catch {
      // Always clear local auth state even if session cleanup fails remotely.
    } finally {
      logout();
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <DashboardSidebar
          items={sidebarItems}
          activeItemId={activeItemId}
          onSelect={navigateToSection}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
        />

        <main className="min-w-0 flex-1 space-y-8">
          <section
            id="perfil"
            className="rounded-2xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-700">painel</p>
                <h1 className="text-3xl font-semibold tracking-tight">Contas e transferencias</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Usuario: {user?.email} ({user?.role})
                </p>
              </div>
              <Button variant="outline" onClick={() => void handleLogout()}>
                Sair
              </Button>
            </div>
          </section>

          <section
            id="transferencias"
            className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Transferir dinheiro</h2>
                <p className="text-xs text-slate-600">Botao de acao para enviar entre contas.</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-slate-500">Saldo da sua conta</p>
                <p className="font-semibold">{formatBalance(myAccount?.balance ?? 0)}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-sm">
                Destino
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={transferTo}
                  onChange={(event) => setTransferTo(event.target.value)}
                >
                  <option value="">Selecione</option>
                  {accounts
                    .filter((account) => account.id !== user?.accountId)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.holderName} ({account.id.slice(0, 8)})
                      </option>
                    ))}
                </select>
              </label>

              <label className="text-sm">
                Valor
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={transferAmount}
                  onChange={(event) => setTransferAmount(event.target.value)}
                />
              </label>

              <label className="text-sm">
                Descricao
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                  value={transferDescription}
                  onChange={(event) => setTransferDescription(event.target.value)}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => void handleTransfer()} disabled={transferLoading}>
                <SendHorizontal className="mr-2 h-4 w-4" />
                {transferLoading ? "Transferindo..." : "Transferir agora"}
              </Button>
              {transferFeedback ? <p className="text-sm text-slate-700">{transferFeedback}</p> : null}
            </div>
          </section>

          {user?.role === "ADMIN" ? (
            <section
              id="administracao"
              className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/60 p-4"
            >
              <h2 className="text-sm font-semibold">Acoes de administrador</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  Conta para credito
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    value={creditAccountId}
                    onChange={(event) => setCreditAccountId(event.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Valor do credito
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={creditAmount}
                    onChange={(event) => setCreditAmount(event.target.value)}
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void handleAddCredit()} disabled={adminLoading}>
                  Adicionar credito
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="text-sm">
                  ID do usuario para excluir
                  <input
                    className="mt-1 w-full rounded-lg border border-rose-300 bg-white px-3 py-2"
                    value={deleteUserId}
                    onChange={(event) => setDeleteUserId(event.target.value)}
                    placeholder="user id"
                  />
                </label>
                <div className="self-end">
                  <Button
                    variant="destructive"
                    disabled={adminLoading}
                    onClick={() => void handleDeleteUser()}
                  >
                    Excluir usuario
                  </Button>
                </div>
              </div>

              {adminFeedback ? <p className="text-sm">{adminFeedback}</p> : null}
            </section>
          ) : null}

          <section
            id="transacoes"
            className="space-y-3 rounded-2xl border border-border bg-card p-4"
          >
            <div>
              <h2 className="text-base font-semibold">Transacoes recentes</h2>
              <p className="text-sm text-muted-foreground">Movimentacoes de entrada e saida da sua conta.</p>
            </div>

            {!loading && accountTransactions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                Sem transacoes para exibir no momento.
              </p>
            ) : null}

            {!loading && accountTransactions.length > 0 ? (
              <ul className="space-y-2">
                {accountTransactions.map((transaction) => {
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
                            <p className="mt-1 text-xs text-muted-foreground">Conta: {counterpart}</p>
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

                      {transaction.description ? (
                        <p className="mt-2 text-xs text-slate-600">{transaction.description}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
              <p className="text-xs text-muted-foreground">Pagina {transactionsPage}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={transactionsPage === 1 || loading}
                  onClick={() => setTransactionsPage((page) => Math.max(1, page - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMoreTransactions || loading}
                  onClick={() => setTransactionsPage((page) => page + 1)}
                >
                  Proxima
                </Button>
              </div>
            </div>
          </section>

          <section
            id="contas"
            className="space-y-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome do titular..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={cn(
                  "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm",
                  "outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring/30",
                )}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Carregando painel...</span>
              </div>
            ) : null}

            {!loading && error ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {!loading && !error && filteredAccounts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                Nenhuma conta encontrada para este filtro.
              </p>
            ) : null}

            {!loading && !error && filteredAccounts.length > 0 ? (
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
            ) : null}

            <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
              <p className="text-xs text-muted-foreground">Pagina {accountsPage}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={accountsPage === 1 || loading}
                  onClick={() => setAccountsPage((page) => Math.max(1, page - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMoreAccounts || loading}
                  onClick={() => setAccountsPage((page) => page + 1)}
                >
                  Proxima
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
