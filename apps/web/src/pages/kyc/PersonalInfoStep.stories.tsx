import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PersonalInfoStep } from "./PersonalInfoStep";
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

function PersonalInfoStory({ values }: { values?: Partial<KycFormData> }) {
  const {
    control,
    formState: { errors },
  } = useForm<KycFormData>({
    defaultValues: { ...baseValues, ...values },
  });

  return <PersonalInfoStep control={control} errors={errors} />;
}

function PersonalInfoErrorsStory() {
  const {
    control,
    formState: { errors },
    trigger,
  } = useForm<KycFormData>({
    defaultValues: baseValues,
    mode: "all",
  });

  useEffect(() => {
    void trigger(["fullName", "email", "phone", "dateOfBirth", "country"]);
  }, [trigger]);

  return <PersonalInfoStep control={control} errors={errors} />;
}

const meta = {
  title: "KYC/PersonalInfoStep",
  component: PersonalInfoStep,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-background p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PersonalInfoStep>;

export default meta;
type Story = StoryObj;

export const Empty: Story = {
  render: () => <PersonalInfoStory />,
};

export const Prefilled: Story = {
  render: () => (
    <PersonalInfoStory
      values={{
        fullName: "João Silva",
        email: "joao@example.com",
        phone: "+5511999990000",
        dateOfBirth: "1990-05-15",
        country: "BR",
      }}
    />
  ),
};

export const WithValidationErrors: Story = {
  render: () => <PersonalInfoErrorsStory />,
};
