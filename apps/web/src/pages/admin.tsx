import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { newIdempotencyKey } from "@/lib/formatters";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/use-auth";

const ACCOUNTS_QUERY = `
  query AdminPageAccounts($page: Int!, $limit: Int!) {
    accounts(page: $page, limit: $limit) {
      id
      holderName
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

type Account = { id: string; holderName: string };

export default function AdminPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditAccountId, setCreditAccountId] = useState("");
  const [creditAmount, setCreditAmount] = useState("100");
  const [deleteUserId, setDeleteUserId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    () => accounts.find((acc) => acc.id === user?.accountId),
    [accounts, user?.accountId],
  );

  useEffect(() => {
    if (myAccount && !creditAccountId) {
      setCreditAccountId(myAccount.id);
    }
  }, [creditAccountId, myAccount]);

  if (user?.role !== "ADMIN") {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Acesso restrito a administradores.
      </div>
    );
  }

  async function handleAddCredit() {
    setLoading(true);
    setFeedback(null);
    try {
      await graphqlRequest(ADD_CREDIT_MUTATION, {
        accountId: creditAccountId,
        amount: Number(creditAmount),
        idempotencyKey: newIdempotencyKey(),
      });
      setFeedback("Credito adicionado com sucesso.");
      await loadAccounts();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Falha ao adicionar credito");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserId) {
      setFeedback("Informe o ID do usuario para excluir.");
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      await graphqlRequest(DELETE_USER_MUTATION, { userId: deleteUserId });
      setFeedback("Usuario excluido com sucesso.");
      setDeleteUserId("");
      await loadAccounts();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Falha ao excluir usuario");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administracao</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acoes administrativas do sistema.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-sky-200 bg-sky-50/60 p-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Adicionar credito</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              Conta
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={creditAccountId}
                onChange={(e) => setCreditAccountId(e.target.value)}
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((acc) => (
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
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </label>
          </div>
          <Button onClick={() => void handleAddCredit()} disabled={loading}>
            Adicionar credito
          </Button>
        </section>

        <section className="space-y-3 border-t border-sky-200 pt-4">
          <h2 className="text-sm font-semibold">Excluir usuario</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="text-sm font-medium">
              ID do usuario
              <input
                className="mt-1 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm"
                value={deleteUserId}
                onChange={(e) => setDeleteUserId(e.target.value)}
                placeholder="user id"
              />
            </label>
            <div className="self-end">
              <Button
                variant="destructive"
                disabled={loading}
                onClick={() => void handleDeleteUser()}
              >
                Excluir usuario
              </Button>
            </div>
          </div>
        </section>

        {feedback && <p className="text-sm">{feedback}</p>}
      </div>
    </div>
  );
}
