import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Providers } from "./components/providers.tsx";
import AccountsPage from "./pages/accounts.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <Suspense fallback="Loading...">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/accounts" element={<AccountsPage />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </Providers>
  </StrictMode>,
);
