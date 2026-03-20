import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { SelfieStep } from "./SelfieStep";
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

function SelfieStory() {
  const {
    control,
    formState: { errors },
  } = useForm<KycFormData>({
    defaultValues: baseValues,
  });

  return <SelfieStep control={control} errors={errors} />;
}

const meta = {
  title: "KYC/SelfieStep",
  component: SelfieStep,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-background p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelfieStep>;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <SelfieStory />,
};
