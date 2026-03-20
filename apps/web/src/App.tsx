import { useNavigate } from "react-router";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function App() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const showKycBanner =
    isAuthenticated &&
    user?.kycStatus !== undefined &&
    user.kycStatus !== "APPROVED";

  const kycStatusLabel: Record<string, string> = {
    PENDING_SUBMISSION: "Não iniciado",
    UNDER_REVIEW: "Em análise",
    REJECTED: "Rejeitado",
  };

  const kycStatusVariant: Record<
    string,
    "warning" | "info" | "destructive"
  > = {
    PENDING_SUBMISSION: "warning",
    UNDER_REVIEW: "info",
    REJECTED: "destructive",
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#fef3c7_0%,#ffffff_45%,#dbeafe_100%)] px-4 py-12 text-slate-900">
      <section className="mx-auto flex max-w-5xl flex-col gap-10 rounded-3xl border border-amber-200/80 bg-white/80 p-8 shadow-2xl backdrop-blur sm:p-12">
        {showKycBanner && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  kycStatusVariant[user!.kycStatus] ?? "warning"
                }
              >
                {kycStatusLabel[user!.kycStatus] ?? user!.kycStatus}
              </Badge>
              <span className="text-sm text-amber-900">
                Verifique sua identidade para acessar todos os recursos.
              </span>
            </div>
            <Button size="sm" onClick={() => navigate("/kyc")}>
              Verificar agora
            </Button>
          </div>
        )}
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700">
            Woovi Bank
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Transfira, receba e administre credito com rastreabilidade.
          </h1>
          <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
            Autenticacao por usuario, regras por papel e operacoes financeiras com
            idempotencia e ledger.
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          {isAuthenticated ? (
            <>
              <Button onClick={() => navigate("/accounts")}>Abrir painel</Button>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Trocar conta
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate("/auth")}>Entrar</Button>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Criar conta
              </Button>
            </>
          )}
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Usuario</h2>
            <p className="mt-2 text-sm text-slate-600">
              Transferencia entre contas ativas com botao de acao direto no
              painel.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Admin</h2>
            <p className="mt-2 text-sm text-slate-600">
              Adiciona credito e exclui usuario conforme permissao de
              administrador.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Sessao</h2>
            <p className="mt-2 text-sm text-slate-600">
              Usuario atual: {user ? `${user.email} (${user.role})` : "nao autenticado"}.
            </p>
          </article>
        </section>
      </section>
    </main>
  );
}
