import AuthPage from "@/pages/auth";
import KycPage from "@/pages/kyc";
import AccountsListPage from "@/pages/accounts-list";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/use-auth";

export function ProtectedDashboardLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="px-4 py-10 text-sm">Carregando sessao...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <DashboardLayout />;
}

export function ProtectedKycRoute() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <div className="px-4 py-10 text-sm">Carregando sessao...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  if (user?.kycStatus === "APPROVED") {
    return <AccountsListPage />;
  }

  return <KycPage />;
}
