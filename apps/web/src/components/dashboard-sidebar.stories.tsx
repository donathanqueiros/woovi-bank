import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { CreditCard, Home, Settings, Users } from "lucide-react"
import { useState, type ComponentType } from "react"

import { DashboardSidebar, type SidebarItem } from "./dashboard-sidebar"

const items: SidebarItem[] = [
  { id: "home", label: "Inicio", icon: Home, description: "Visao geral da conta" },
  { id: "accounts", label: "Contas", icon: CreditCard, description: "Gerenciar contas" },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "settings", label: "Configuracoes", icon: Settings },
]

type SidebarStoryArgs = {
  items: SidebarItem[]
  activeItemId: string
  mobileOpen: boolean
  onSelect: (id: string) => void
  onMobileOpenChange: (open: boolean) => void
}

type SidebarStoryComponent = ComponentType<{ args?: Partial<SidebarStoryArgs> }>
type SidebarStoryContext = { args: SidebarStoryArgs }

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
    onSelect: fn(),
    onMobileOpenChange: fn(),
  },
} satisfies Meta<typeof DashboardSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: "desktop" },
  },
  decorators: [
    (Story: SidebarStoryComponent) => (
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
    (Story: SidebarStoryComponent) => (
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
    (Story: SidebarStoryComponent) => (
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
    (Story: SidebarStoryComponent, ctx: SidebarStoryContext) => {
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
