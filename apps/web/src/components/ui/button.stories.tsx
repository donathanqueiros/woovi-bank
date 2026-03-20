import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

import { Button } from "./button"

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Transferir",
    variant: "default",
    size: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: (args: ComponentProps<typeof Button>) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="default">Default</Button>
      <Button {...args} variant="outline">Outline</Button>
      <Button {...args} variant="secondary">Secondary</Button>
      <Button {...args} variant="ghost">Ghost</Button>
      <Button {...args} variant="destructive">Destructive</Button>
      <Button {...args} variant="link">Link</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args: ComponentProps<typeof Button>) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="xs">XS</Button>
      <Button {...args} size="sm">SM</Button>
      <Button {...args} size="default">Default</Button>
      <Button {...args} size="lg">LG</Button>
      <Button {...args} size="icon" aria-label="Icon button">+</Button>
      <Button {...args} size="icon-xs" aria-label="Icon xs">+</Button>
      <Button {...args} size="icon-sm" aria-label="Icon sm">+</Button>
      <Button {...args} size="icon-lg" aria-label="Icon lg">+</Button>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Indisponivel",
  },
}
