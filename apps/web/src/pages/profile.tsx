import { ShieldCheck, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/use-auth";
import { getKycActionCopy, KYC_ROUTE } from "@/pages/kyc/kyc-access";

const LOGOUT_MUTATION = `
  mutation Logout {
    Logout
  }
`;

const kycStatusLabel: Record<string, string> = {
  PENDING_SUBMISSION: "Nao iniciado",
  UNDER_REVIEW: "Em analise",
  REJECTED: "Rejeitado",
  APPROVED: "Aprovado",
};

const kycStatusVariant: Record<string, "warning" | "info" | "destructive" | "success"> = {
  PENDING_SUBMISSION: "warning",
  UNDER_REVIEW: "info",
  REJECTED: "destructive",
  APPROVED: "success",
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const kycAction = getKycActionCopy(user?.kycStatus);

  async function handleLogout() {
    try {
      await graphqlRequest(LOGOUT_MUTATION, {});
    } catch {
      // always clear local state
    } finally {
      logout();
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-border/70 bg-card px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Sessao e seguranca
            </Badge>
            <h1>Perfil</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Visualize dados da sessao atual e acompanhe a situacao de verificacao da conta.
            </p>
          </div>
          <div className="flex size-14 items-center justify-center rounded-[20px] bg-primary/10 text-primary">
            <UserCircle2 className="size-7" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[24px] border border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <UserCircle2 className="size-5" />
            </div>
            <div>
              <h2 className="text-lg">Conta atual</h2>
              <p className="text-sm text-muted-foreground">
                Informacoes basicas da sessao em uso.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-[20px] border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Email</p>
              <p className="mt-2 text-sm font-medium text-foreground">{user?.email}</p>
            </div>
            <div className="rounded-[20px] border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Perfil</p>
              <p className="mt-2 text-sm font-medium text-foreground">{user?.role}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[24px] border border-border/70 bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="text-lg">Verificacao</h2>
              <p className="text-sm text-muted-foreground">
                {kycAction.description}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {user?.kycStatus ? (
              <div className="rounded-[20px] border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Status KYC
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Badge variant={kycStatusVariant[user.kycStatus] ?? "secondary"}>
                    {kycStatusLabel[user.kycStatus] ?? user.kycStatus}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => navigate(KYC_ROUTE)}>
                    {kycAction.label}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="rounded-[20px] border border-border/70 bg-background/80 p-4">
              <p className="text-sm font-medium text-foreground">Tema da interface</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Ajuste a paleta visual da aplicacao em Configuracoes para adequar contraste e estilo.
              </p>
              <Button
                className="mt-4"
                size="sm"
                variant="outline"
                onClick={() => navigate("/settings")}
              >
                Abrir configuracoes
              </Button>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[24px] border border-border/70 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg">Encerrar sessao</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saia da conta atual mantendo o estado local consistente.
            </p>
          </div>
          <Button variant="outline" onClick={() => void handleLogout()}>
            Sair da conta
          </Button>
        </div>
      </section>
    </div>
  );
}
