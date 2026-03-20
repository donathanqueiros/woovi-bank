import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { StepIndicator } from "./step-indicator";

const allSteps: ComponentProps<typeof StepIndicator>["steps"] = [
  { label: "Dados Pessoais", status: "pending" },
  { label: "Endereço", status: "pending" },
  { label: "Identidade", status: "pending" },
  { label: "Selfie", status: "pending" },
  { label: "Revisão", status: "pending" },
];

const meta = {
  title: "KYC/StepIndicator",
  component: StepIndicator,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="bg-background p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Step1Active: Story = {
  args: {
    steps: allSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? "active" : "pending",
    })),
  },
};

export const Step3Active: Story = {
  args: {
    steps: allSteps.map((step, index) => ({
      ...step,
      status: index < 2 ? "completed" : index === 2 ? "active" : "pending",
    })),
  },
};

export const LastStepActive: Story = {
  args: {
    steps: allSteps.map((step, index) => ({
      ...step,
      status: index < 4 ? "completed" : "active",
    })),
  },
};

export const AllCompleted: Story = {
  args: {
    steps: allSteps.map((step) => ({ ...step, status: "completed" as const })),
  },
};
