import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { AddressStep } from "./AddressStep";
import type { KycFormData } from "./kyc-schemas";

const baseValues: KycFormData = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  country: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  proofDocumentBase64: undefined,
  proofDocumentMimeType: undefined,
  idType: "PASSPORT",
  idNumber: "",
  frontImageBase64: "",
  backImageBase64: undefined,
  selfieBase64: "",
  termsAccepted: true,
};

function AddressStory({ values }: { values?: Partial<KycFormData> }) {
  const {
    control,
    formState: { errors },
  } = useForm<KycFormData>({
    defaultValues: { ...baseValues, ...values },
  });

  return <AddressStep control={control} errors={errors} />;
}

const meta = {
  title: "KYC/AddressStep",
  component: AddressStep,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-background p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AddressStep>;

export default meta;
type Story = StoryObj;

export const Empty: Story = {
  render: () => <AddressStory />,
};

export const Prefilled: Story = {
  render: () => (
    <AddressStory
      values={{
        street: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        postalCode: "01310-100",
      }}
    />
  ),
};
