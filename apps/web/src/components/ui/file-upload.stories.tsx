import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ComponentProps } from "react";
import { fn } from "storybook/test";
import { FileUpload } from "./file-upload";

function InteractiveFileUpload(args: ComponentProps<typeof FileUpload>) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="flex w-100 flex-col gap-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Selecione um arquivo</p>
        <p className="text-xs text-muted-foreground">PDF, JPG ou PNG - máx. 5 MB</p>
      </div>
      <FileUpload
        {...args}
        value={file}
        onChange={(nextFile) => {
          setFile(nextFile);
          args.onChange?.(nextFile);
        }}
      />
      {file && (
        <p className="text-xs text-muted-foreground">
          Selecionado: {file.name} - tamanho: {file.size} bytes
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
