import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/use-auth";

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

const kycStatusVariant: Record<string, "warning" | "info" | "destructive" | "default"> = {
  PENDING_SUBMISSION: "warning",
  UNDER_REVIEW: "info",
  REJECTED: "destructive",
  APPROVED: "default",
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informacoes da sessao e seguranca.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Email</p>
          <p className="text-sm font-medium">{user?.email}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Perfil</p>
          <p className="text-sm font-medium">{user?.role}</p>
        </div>

        {user?.kycStatus && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Status KYC</p>
            <div className="flex items-center gap-3">
              <Badge variant={kycStatusVariant[user.kycStatus] ?? "default"}>
                {kycStatusLabel[user.kycStatus] ?? user.kycStatus}
              </Badge>
              {user.kycStatus !== "APPROVED" && (
                <Button size="sm" variant="outline" onClick={() => navigate("/kyc")}>
                  Verificar identidade
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <Button variant="outline" onClick={() => void handleLogout()}>
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
