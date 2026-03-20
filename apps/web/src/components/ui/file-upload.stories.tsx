import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { fn } from "storybook/test";
import { FileUpload } from "./file-upload";

function InteractiveFileUpload(args: ComponentProps<typeof FileUpload>) {
  const [base64, setBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="flex w-100 flex-col gap-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Selecione um arquivo</p>
        <p className="text-xs text-muted-foreground">PDF, JPG ou PNG - máx. 5 MB</p>
      </div>
      <FileUpload
        {...args}
        onChange={(file, value) => {
          setFileName(file?.name ?? null);
          setBase64(value);
          args.onChange?.(file, value);
        }}
      />
      {fileName && (
        <p className="text-xs text-muted-foreground">
          Selecionado: {fileName} - base64 len: {base64?.length ?? 0}
        </p>
      )}
    </div>
  );
}

const meta = {
  title: "UI/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-100">
        <Story />
      </div>
    ),
  ],
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithHelpText: Story = {
  render: (args) => <InteractiveFileUpload {...args} />,
};

export const WithError: Story = {
  args: {
    error: "Arquivo muito grande (máx. 5 MB)",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Interactive: Story = {
  render: (args) => <InteractiveFileUpload {...args} />,
};
