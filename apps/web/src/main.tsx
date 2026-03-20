import { BrowserRouter, Route, Routes } from "react-router";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Providers } from "./components/providers.tsx";
import AuthPage from "./pages/auth.tsx";
import AccountsListPage from "./pages/accounts-list.tsx";
import TransactionsPage from "./pages/transactions.tsx";
import TransferPage from "./pages/transfer.tsx";
import ProfilePage from "./pages/profile.tsx";
import AdminPage from "./pages/admin.tsx";
import { ProtectedDashboardLayout, ProtectedKycRoute } from "./routes/protected-routes.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <Suspense fallback="Loading...">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedDashboardLayout />}>
              <Route path="/accounts" element={<AccountsListPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/transfer" element={<TransferPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="/kyc" element={<ProtectedKycRoute />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </Providers>
  </StrictMode>,
);
