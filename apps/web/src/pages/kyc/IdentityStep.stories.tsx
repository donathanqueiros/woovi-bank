import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { IdentityStep } from "./IdentityStep";
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
  proofDocumentFile: undefined,
  idType: "PASSPORT",
  idNumber: "",
  frontImageFile: undefined,
  backImageFile: undefined,
  selfieBase64: "",
  termsAccepted: true,
};

function IdentityStory({ values }: { values?: Partial<KycFormData> }) {
  const {
    control,
    formState: { errors },
  } = useForm<KycFormData>({
    defaultValues: { ...baseValues, ...values },
  });

  return <IdentityStep control={control} errors={errors} />;
}

const meta = {
  title: "KYC/IdentityStep",
  component: IdentityStep,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-background p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IdentityStep>;

export default meta;
type Story = StoryObj;

export const NoSelection: Story = {
  render: () => <IdentityStory values={{ idNumber: "" }} />,
};

export const Passport: Story = {
  render: () => (
    <IdentityStory
      values={{
        idType: "PASSPORT",
        idNumber: "A1234567",
      }}
    />
  ),
};

export const RGWithBackImage: Story = {
  render: () => (
    <IdentityStory
      values={{
        idType: "RG",
        idNumber: "529.982.247-25",
      }}
    />
  ),
};
