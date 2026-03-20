import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  ArrowRightLeft,
  Globe2,
  Landmark,
  MoonStar,
  Settings,
  ShieldCheck,
  SunMedium,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useTheme } from "@/lib/use-theme";

const LOGOUT_MUTATION = `
  mutation Logout {
    Logout
  }
`;

const LANGUAGE_OPTIONS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
] as const;

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentLanguage = LANGUAGE_OPTIONS.find(
    (option) => option.value === (i18n.resolvedLanguage ?? i18n.language),
  );
  const navItems = [
    { path: "/accounts", label: t("dashboard.nav.accounts"), icon: Landmark },
    { path: "/transactions", label: t("dashboard.nav.transactions"), icon: ArrowRightLeft },
    { path: "/profile", label: t("dashboard.nav.profile"), icon: User },
    { path: "/settings", label: t("dashboard.nav.settings"), icon: Settings },
  ];
  const adminItems = [{ path: "/admin", label: t("dashboard.nav.admin"), icon: ShieldCheck }];
  const pageTitles: Record<string, { title: string; description: string }> = {
    "/accounts": {
      title: t("dashboard.pages.accounts.title"),
      description: t("dashboard.pages.accounts.description"),
    },
    "/transactions": {
      title: t("dashboard.pages.transactions.title"),
      description: t("dashboard.pages.transactions.description"),
    },
    "/transfer": {
      title: t("dashboard.pages.transfer.title"),
      description: t("dashboard.pages.transfer.description"),
    },
    "/profile": {
      title: t("dashboard.pages.profile.title"),
      description: t("dashboard.pages.profile.description"),
    },
    "/profile/kyc": {
      title: "KYC",
      description: "Acompanhe e revise os dados enviados para verificacao.",
    },
    "/admin": {
      title: t("dashboard.pages.admin.title"),
      description: t("dashboard.pages.admin.description"),
    },
    "/settings": {
      title: t("dashboard.pages.settings.title"),
      description: t("dashboard.pages.settings.description"),
    },
  };
  const pageMeta = pageTitles[location.pathname] ?? {
    title: "Subli Bank",
    description: t("dashboard.pages.defaultDescription"),
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
              Subli Bank
            </p>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {user?.email}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {user?.role === "ADMIN" ? t("dashboard.roles.admin") : t("dashboard.roles.operation")}
              </Badge>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarGroup>
            <SidebarGroupLabel>{t("dashboard.sections.navigation")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {navItems.map((item) => (
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
              <SidebarGroupLabel>{t("dashboard.sections.admin")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {adminItems.map((item) => (
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
          <div className="mb-3 rounded-[18px] border border-sidebar-border/80 bg-card/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <Globe2 className="size-3.5" />
              <span>{t("dashboard.language.title")}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sidebar-language" className="text-xs text-foreground/80">
                {t("dashboard.language.label")}
              </Label>
              <Select
                id="sidebar-language"
                className="h-9 bg-background"
                value={currentLanguage?.value ?? "pt-BR"}
                onChange={(event) => {
                  void i18n.changeLanguage(event.target.value);
                }}
                aria-label={t("dashboard.language.ariaLabel")}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={() => void handleLogout()}>
            <User className="mr-2 size-4" />
            {t("dashboard.actions.logout")}
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
          <Button
            variant="outline"
            size="icon-sm"
            className="ml-auto"
            aria-label={
              mode === "dark"
                ? t("dashboard.actions.enableLight")
                : t("dashboard.actions.enableDark")
            }
            onClick={toggleMode}
          >
            {mode === "dark" ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
          </Button>
          <Button size="sm" onClick={() => navigate("/transfer")}>
            {t("dashboard.actions.transfer")}
          </Button>
        </header>

        <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
