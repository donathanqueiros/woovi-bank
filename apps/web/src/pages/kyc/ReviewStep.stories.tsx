import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { fn } from "storybook/test";
import { ReviewStep } from "./ReviewStep";
import type { KycFormData } from "./kyc-schemas";

function ReviewStory() {
  const defaultValues: KycFormData = {
    fullName: "João Silva",
    email: "joao@example.com",
    phone: "+5511999990000",
    dateOfBirth: "1990-05-15",
    country: "BR",
    street: "Rua das Flores, 123",
    city: "São Paulo",
    state: "SP",
    postalCode: "01310-100",
    proofDocumentBase64: "data:application/pdf;base64,abc",
    proofDocumentMimeType: "application/pdf",
    idType: "RG",
    idNumber: "529.982.247-25",
    frontImageBase64: "data:image/png;base64,abc",
    backImageBase64: "data:image/png;base64,def",
    selfieBase64: "data:image/png;base64,ghi",
    termsAccepted: true,
  };

  const {
    control,
    formState: { errors },
    getValues,
  } = useForm<KycFormData>({
    defaultValues,
  });

  return (
    <ReviewStep
      control={control}
      errors={errors}
      getValues={getValues}
      onEditStep={fn()}
    />
  );
}

const meta = {
  title: "KYC/ReviewStep",
  component: ReviewStep,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewStep>;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <ReviewStory />,
};
