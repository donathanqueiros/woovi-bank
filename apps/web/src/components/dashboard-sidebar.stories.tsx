import type { Meta, StoryObj } from "@storybook/react-vite"
import { CreditCard, Home, Settings, Users } from "lucide-react"
import { useState } from "react"

import { DashboardSidebar, type SidebarItem } from "./dashboard-sidebar"

const items: SidebarItem[] = [
  { id: "home", label: "Inicio", icon: Home, description: "Visao geral da conta" },
  { id: "accounts", label: "Contas", icon: CreditCard, description: "Gerenciar contas" },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "settings", label: "Configuracoes", icon: Settings },
]

const meta = {
  title: "Components/DashboardSidebar",
  component: DashboardSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    items,
    activeItemId: "home",
    mobileOpen: false,
    onSelect: (_id: string) => {},
    onMobileOpenChange: (_open: boolean) => {},
  },
} satisfies Meta<typeof DashboardSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop" },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen gap-6 bg-muted/40 p-4">
        <Story />
        <main className="flex-1 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Conteudo principal</p>
        </main>
      </div>
    ),
  ],
}

export const MobileOpen: Story = {
  args: {
    mobileOpen: true,
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-muted/40 p-4">
        <Story />
        <main className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Conteudo principal</p>
        </main>
      </div>
    ),
  ],
}

export const MobileClosed: Story = {
  args: {
    mobileOpen: false,
  },
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-muted/40 p-4">
        <Story />
        <main className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Conteudo principal</p>
        </main>
      </div>
    ),
  ],
}

export const Interactive: Story = {
  decorators: [
    (Story, ctx) => {
      const [active, setActive] = useState("home")
      const [open, setOpen] = useState(false)

      return (
        <div className="flex min-h-screen gap-6 bg-muted/40 p-4">
          <Story
            args={{
              ...ctx.args,
              activeItemId: active,
              mobileOpen: open,
              onSelect: setActive,
              onMobileOpenChange: setOpen,
            }}
          />
          <main className="flex-1 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Secao ativa: <strong>{active}</strong>
            </p>
          </main>
        </div>
      )
    },
  ],
}
