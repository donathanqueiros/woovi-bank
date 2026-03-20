import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
      <div className="rounded-[22px] border border-border/70 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
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
      <section className="rounded-[24px] border border-border/70 bg-card px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Controle restrito
            </Badge>
            <h1>Administracao</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Operacoes sensiveis para credito e remocao de usuario com feedback claro.
            </p>
          </div>
          <div className="flex size-14 items-center justify-center rounded-[20px] bg-primary/10 text-primary">
            <ShieldCheck className="size-7" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[24px] border border-border/70 bg-card p-6">
          <div className="space-y-2">
            <h2 className="text-lg">Adicionar credito</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Escolha a conta e aplique o valor com rastreabilidade por idempotencia.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2 text-sm font-medium">
              <span>Conta</span>
              <Select value={creditAccountId} onChange={(e) => setCreditAccountId(e.target.value)}>
                <option value="">Selecione uma conta</option>
                {accounts.map((acc) => (
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
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </label>
          </div>

          <div className="mt-6">
            <Button onClick={() => void handleAddCredit()} disabled={loading}>
              Adicionar credito
            </Button>
          </div>
        </article>

        <article className="rounded-[24px] border border-destructive/18 bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="text-lg">Excluir usuario</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Acao destrutiva. Confirme o identificador antes de prosseguir.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2 text-sm font-medium">
              <span>ID do usuario</span>
              <Input
                value={deleteUserId}
                onChange={(e) => setDeleteUserId(e.target.value)}
                placeholder="user id"
              />
            </label>
          </div>

          <div className="mt-6">
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => void handleDeleteUser()}
            >
              Excluir usuario
            </Button>
          </div>
        </article>
      </section>

      {feedback ? (
        <div className="rounded-[20px] border border-border/70 bg-card px-5 py-4 text-sm text-foreground">
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
