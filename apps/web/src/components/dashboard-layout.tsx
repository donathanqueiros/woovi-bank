import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  ArrowRightLeft,
  Landmark,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { graphqlRequest } from "@/lib/graphqlClient";

const LOGOUT_MUTATION = `
  mutation Logout {
    Logout
  }
`;

const NAV_ITEMS = [
  {
    path: "/accounts",
    label: "Contas",
    icon: Landmark,
  },
  {
    path: "/transactions",
    label: "Historico",
    icon: ArrowRightLeft,
  },
  {
    path: "/profile",
    label: "Perfil",
    icon: User,
  },
  {
    path: "/settings",
    label: "Configuracoes",
    icon: Settings,
  },
];

const ADMIN_ITEMS = [
  {
    path: "/admin",
    label: "Administracao",
    icon: ShieldCheck,
  },
];

const PAGE_TITLES: Record<string, { title: string; description: string }> = {
  "/accounts": {
    title: "Contas",
    description: "Consulta, busca e leitura do ecossistema de contas.",
  },
  "/transactions": {
    title: "Historico",
    description: "Visao de movimentacoes com leitura rapida de entradas e saidas.",
  },
  "/transfer": {
    title: "Transferencias",
    description: "Acao primaria para enviar valores entre contas.",
  },
  "/profile": {
    title: "Perfil",
    description: "Sessao, verificacao e seguranca da conta.",
  },
  "/admin": {
    title: "Administracao",
    description: "Controles sensiveis e operacoes restritas.",
  },
  "/settings": {
    title: "Configuracoes",
    description: "Preferencias visuais e ajustes de experiencia.",
  },
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pageMeta = PAGE_TITLES[location.pathname] ?? {
    title: "Woovi Bank",
    description: "Painel operacional da aplicacao.",
  };

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
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="px-3 pb-4 pt-4">
          <div className="rounded-[20px] border border-sidebar-border/80 bg-card/70 px-4 py-4 shadow-[0_18px_34px_-26px_color-mix(in_oklab,var(--foreground)_18%,transparent)]">
            <p className="text-xs uppercase tracking-[0.28em] text-primary">
              Woovi Bank
            </p>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {user?.email}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {user?.role === "ADMIN" ? "Administrador" : "Operacao"}
              </Badge>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel>Navegacao</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <NavLink to={item.path}>
                      {({ isActive }) => (
                        <SidebarMenuButton
                          isActive={isActive}
                          className="h-10 rounded-xl px-3 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:shadow-[0_14px_28px_-20px_color-mix(in_oklab,var(--sidebar-primary)_55%,transparent)]"
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {user?.role === "ADMIN" && (
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {ADMIN_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <NavLink to={item.path}>
                        {({ isActive }) => (
                          <SidebarMenuButton
                            isActive={isActive}
                            className="h-10 rounded-xl px-3 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:shadow-[0_14px_28px_-20px_color-mix(in_oklab,var(--sidebar-primary)_55%,transparent)]"
                          >
                            <item.icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="px-3 pb-4">
          <Button variant="outline" className="w-full justify-start" onClick={() => void handleLogout()}>
            <User className="mr-2 size-4" />
            Sair
          </Button>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh">
        <header className="sticky top-0 z-20 flex min-h-20 shrink-0 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 hidden h-5 md:block" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-primary">
              {pageMeta.title}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {pageMeta.description}
            </p>
          </div>
          <Button size="sm" className="ml-auto" onClick={() => navigate("/transfer")}>
            Fazer transferencia
          </Button>
        </header>

        <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
