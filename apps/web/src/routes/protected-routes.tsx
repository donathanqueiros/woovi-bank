import AuthPage from "@/pages/auth";
import { Navigate } from "react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/lib/use-auth";
import { KYC_ROUTE } from "@/pages/kyc/kyc-access";
import KycPage from "@/pages/kyc/kyc";

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
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="px-4 py-10 text-sm">Carregando sessao...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <KycPage />;
}

export function LegacyKycRouteRedirect() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <div className="px-4 py-10 text-sm">Carregando sessao...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <Navigate replace to={KYC_ROUTE} />;
}
