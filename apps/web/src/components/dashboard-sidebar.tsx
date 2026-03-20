import { useMemo } from "react";
import { Menu, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SidebarItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
};

type DashboardSidebarProps = {
  items: SidebarItem[];
  activeItemId: string;
  onSelect: (id: string) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (next: boolean) => void;
};

function SidebarNav({
  items,
  activeItemId,
  onSelect,
}: {
  items: SidebarItem[];
  activeItemId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label="Navegacao do painel" className="space-y-1.5">
      {items.map((item) => {
        const isActive = item.id === activeItemId;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "w-full rounded-xl border px-3 py-2 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              isActive
                ? "border-amber-300 bg-amber-100/80 text-slate-900"
                : "border-transparent bg-transparent text-slate-600 hover:border-border hover:bg-background hover:text-slate-900",
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </div>
            {item.description ? (
              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar({
  items,
  activeItemId,
  onSelect,
  mobileOpen,
  onMobileOpenChange,
}: DashboardSidebarProps) {
  const activeLabel = useMemo(
    () => items.find((item) => item.id === activeItemId)?.label ?? "Painel",
    [activeItemId, items],
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3 lg:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Menu</p>
          <p className="text-sm font-medium">{activeLabel}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Abrir menu lateral"
          aria-expanded={mobileOpen}
          aria-controls="dashboard-sidebar-mobile"
          onClick={() => onMobileOpenChange(true)}
        >
          <Menu className="size-4" />
        </Button>
      </div>

      <aside className="sticky top-4 hidden h-[calc(100svh-2rem)] w-72 shrink-0 rounded-2xl border border-border bg-card p-4 lg:block">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Navegacao</p>
        <h2 className="mt-2 text-lg font-semibold">Subli Bank</h2>
        <p className="mt-1 text-sm text-muted-foreground">Acesso rapido do painel</p>
        <div className="mt-5">
          <SidebarNav items={items} activeItemId={activeItemId} onSelect={onSelect} />
        </div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => onMobileOpenChange(false)}
        aria-hidden={!mobileOpen}
      />

      <aside
        id="dashboard-sidebar-mobile"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card p-4 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Navegacao</p>
            <h2 className="mt-2 text-lg font-semibold">Subli Bank</h2>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Fechar menu lateral"
            onClick={() => onMobileOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <SidebarNav
          items={items}
          activeItemId={activeItemId}
          onSelect={(id) => {
            onSelect(id);
            onMobileOpenChange(false);
          }}
        />
      </aside>
    </>
  );
}
