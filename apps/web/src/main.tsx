import { BrowserRouter, Route, Routes } from "react-router";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Providers } from "./components/providers.tsx";
import AuthPage from "./pages/auth.tsx";
import AccountsListPage from "./pages/accounts/accounts-list.tsx";
import DepositPage from "./pages/deposit/deposit.tsx";
import HomePage from "./pages/home.tsx";
import TransactionsPage from "./pages/transactions.tsx";
import TransferPage from "./pages/transfer/transfer.tsx";
import ProfilePage from "./pages/profile.tsx";
import AdminPage from "./pages/admin.tsx";
import SettingsPage from "./pages/settings.tsx";
import {
  LegacyKycRouteRedirect,
  ProtectedDashboardLayout,
  ProtectedKycRoute,
} from "./routes/protected-routes.tsx";
import { initializeTheme } from "./lib/theme.ts";

initializeTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <Suspense fallback="Loading...">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedDashboardLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/accounts" element={<AccountsListPage />} />
              <Route path="/deposit" element={<DepositPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transfer" element={<TransferPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/kyc" element={<ProtectedKycRoute />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="/kyc" element={<LegacyKycRouteRedirect />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </Providers>
  </StrictMode>,
);
