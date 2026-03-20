import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/use-auth";
import { graphqlRequest } from "@/lib/graphqlClient";
import { Button } from "@/components/ui/button";

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
      navigate("/accounts");
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

      navigate("/accounts");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7,#fff_42%)] px-4 py-12 text-slate-900">
      <section className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-white/85 p-6 shadow-xl backdrop-blur">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-amber-700">
            Woovi Bank
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "login"
              ? "Acesse sua conta para transferir dinheiro."
              : "Nova conta inicia com credito de R$ 1.000."}
          </p>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-md px-3 py-2 text-sm ${
              mode === "login" ? "bg-white shadow" : "text-slate-600"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-md px-3 py-2 text-sm ${
              mode === "signup" ? "bg-white shadow" : "text-slate-600"
            }`}
          >
            Cadastro
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
            />
          </label>

          <label className="block text-sm font-medium">
            Senha
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "Processando..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </Button>
        </form>
      </section>
    </main>
  );
}
