import { NavLink, Outlet, useNavigate } from "react-router";
import {
  ArrowRightLeft,
  Landmark,
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
];

const ADMIN_ITEMS = [
  {
    path: "/admin",
    label: "Administracao",
    icon: ShieldCheck,
  },
];

export function DashboardLayout() {
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
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="px-2 py-2">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
              Woovi Bank
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {user?.email}
            </p>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegacao</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <NavLink to={item.path}>
                      {({ isActive }) => (
                        <SidebarMenuButton isActive={isActive}>
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
                <SidebarMenu>
                  {ADMIN_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <NavLink to={item.path}>
                        {({ isActive }) => (
                          <SidebarMenuButton isActive={isActive}>
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

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => void handleLogout()}>
                <User />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <p className="text-sm text-muted-foreground">Woovi Bank</p>
          <Button size="sm" className="ml-auto" onClick={() => navigate("/transfer")}>
            Fazer transferencia
          </Button>
        </header>

        <div className="flex-1 p-4 sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
