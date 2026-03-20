import { ArrowRight, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getKycActionCopy, KYC_ROUTE } from "@/pages/kyc/kyc-access";

export default function App() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const showKycBanner =
    isAuthenticated &&
    user?.kycStatus !== undefined &&
    user.kycStatus !== "APPROVED";

  const kycStatusLabel: Record<string, string> = {
    PENDING_SUBMISSION: "Nao iniciado",
    UNDER_REVIEW: "Em analise",
    REJECTED: "Rejeitado",
  };

  const kycStatusVariant: Record<string, "warning" | "info" | "destructive"> = {
    PENDING_SUBMISSION: "warning",
    UNDER_REVIEW: "info",
    REJECTED: "destructive",
  };
  const kycAction = getKycActionCopy(user?.kycStatus);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        {showKycBanner ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-warning/25 bg-[color:color-mix(in_oklab,var(--warning)_12%,white)] px-5 py-4">
            <div className="flex items-center gap-3">
              <Badge variant={kycStatusVariant[user!.kycStatus] ?? "warning"}>
                {kycStatusLabel[user!.kycStatus] ?? user!.kycStatus}
              </Badge>
              <span className="text-sm text-foreground">
                Verifique sua identidade para liberar todos os recursos operacionais.
              </span>
            </div>
            <Button size="sm" onClick={() => navigate(KYC_ROUTE)}>
              {kycAction.label}
            </Button>
          </div>
        ) : null}

        <section className="rounded-[28px] border border-border/70 bg-card px-6 py-8 shadow-[0_32px_60px_-42px_color-mix(in_oklab,var(--foreground)_18%,transparent)] sm:px-10 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
            <div className="space-y-6">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                Plataforma operacional de banking
              </Badge>
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.32em] text-primary">
                  Woovi Bank
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] text-foreground sm:text-5xl sm:leading-[1.02]">
                  Interface financeira com clareza visual para operar, analisar e decidir.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Transfira, acompanhe movimentacoes e gerencie operacoes com uma
                  camada visual mais confiavel, limpa e profissional.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <>
                    <Button size="lg" onClick={() => navigate("/accounts")}>
                      Abrir painel
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => navigate("/settings")}>
                      Personalizar tema
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" onClick={() => navigate("/auth")}>
                      Entrar
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
                      Criar conta
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <article className="rounded-[24px] border border-border/70 bg-background/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Controle e confianca</p>
                    <p className="text-sm text-muted-foreground">
                      Operacoes com leitura rapida de estados, contexto e proximas acoes.
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[24px] border border-border/70 bg-background/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Pronto para operacao B2B</p>
                    <p className="text-sm text-muted-foreground">
                      Fluxos que favorecem produtividade, auditoria e seguranca da sessao.
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[24px] border border-border/70 bg-background/80 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Aparencia configuravel</p>
                    <p className="text-sm text-muted-foreground">
                      Escolha entre tres paletas de tema para toda a aplicacao.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
