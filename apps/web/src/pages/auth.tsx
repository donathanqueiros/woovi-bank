import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/use-auth";
import { graphqlRequest } from "@/lib/graphqlClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

type AuthPayload = {
  Login?: {
    user: {
      id: string;
      email: string;
      role: "USER" | "ADMIN";
    };
    account: {
      id: string;
    };
  };
  SignUp?: {
    user: {
      id: string;
      email: string;
      role: "USER" | "ADMIN";
    };
    account: {
      id: string;
    };
  };
};

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    Login(email: $email, password: $password) {
      user {
        id
        email
        role
      }
      account {
        id
      }
    }
  }
`;

const SIGNUP_MUTATION = `
  mutation SignUp($email: String!, $password: String!) {
    SignUp(email: $email, password: $password) {
      user {
        id
        email
        role
      }
      account {
        id
      }
    }
  }
`;

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isBootstrapping, setUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, isBootstrapping, navigate]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await graphqlRequest<AuthPayload>(
        mode === "login" ? LOGIN_MUTATION : SIGNUP_MUTATION,
        { email, password },
      );

      const payload = mode === "login" ? data.Login : data.SignUp;

      if (!payload) {
        throw new Error("Resposta de autenticacao invalida");
      }

      setUser({
        id: payload.user.id,
        email: payload.user.email,
        role: payload.user.role,
        accountId: payload.account.id,
        kycStatus: payload.user.role === "ADMIN" ? "APPROVED" : "PENDING_SUBMISSION",
      });

      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto grid max-w-6xl overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_34px_70px_-48px_color-mix(in_oklab,var(--foreground)_18%,transparent)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="order-1 px-6 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-md">
            <header className="space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Acesso</p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                {mode === "login" ? "Entrar na conta" : "Criar nova conta"}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {mode === "login"
                  ? "Entre para acessar seu painel operacional."
                  : "Cadastros iniciam com credito de R$ 1.000 para explorar a experiencia."}
              </p>
            </header>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-muted/60 p-1.5">
              {([
                { value: "login", label: "Login" },
                { value: "signup", label: "Cadastro" },
              ] as const).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    mode === item.value
                      ? "bg-card text-foreground shadow-[0_14px_24px_-20px_color-mix(in_oklab,var(--foreground)_18%,transparent)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2 text-sm font-medium text-foreground">
                <span>Email</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11"
                  placeholder="voce@empresa.com"
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-foreground">
                <span>Senha</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  className="h-11"
                  placeholder="Minimo de 8 caracteres"
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
                {!loading ? <ArrowRight className="ml-2 size-4" /> : null}
              </Button>
            </form>
          </div>
        </div>

        <div className="order-2 flex flex-col justify-between gap-8 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--secondary)_82%,white),transparent)] px-6 py-8 sm:px-8 sm:py-10">
          <div className="space-y-5">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Banking operations
            </Badge>
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.32em] text-primary">Subli Bank</p>
              <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-[-0.05em] text-foreground">
                Uma experiencia mais clara para operar contas, saldo e historico.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                O novo visual reduz ruido, melhora foco nas acoes e reforca a sensacao de
                confianca em cada etapa do fluxo.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <article className="rounded-[22px] border border-border/70 bg-card/80 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Wallet className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Saldo e operacao em destaque</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Acao principal, leitura de conta e proximos passos ficam visiveis logo de cara.
                  </p>
                </div>
              </div>
            </article>
            <article className="rounded-[22px] border border-border/70 bg-card/80 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Confianca operacional</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Interface pensada para times que precisam agir rapido sem perder contexto.
                  </p>
                </div>
              </div>
            </article>
            <article className="rounded-[22px] border border-border/70 bg-card/80 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Visual configuravel</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Tres paletas globais para adequar a experiencia ao estilo da operacao.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
