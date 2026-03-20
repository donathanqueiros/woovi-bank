import { useTranslation } from "react-i18next";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import type { KycFormData } from "./kyc-schemas";

type AddressStepProps = {
  control: Control<KycFormData>;
  errors: FieldErrors<KycFormData>;
};

export function AddressStep({ control, errors }: AddressStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold text-foreground">
          {t("kyc.address.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("kyc.address.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="street"
          label={t("kyc.address.street")}
          error={t(errors.street?.message || "")}
          required
          className="sm:col-span-2"
        >
          <Controller
            name="street"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="street"
                placeholder={t("kyc.address.streetPlaceholder")}
                aria-invalid={Boolean(errors.street)}
                autoComplete="street-address"
              />
            )}
          />
        </FormField>

        <FormField
          id="city"
          label={t("kyc.address.city")}
          error={t(errors.city?.message || "")}
          required
        >
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="city"
                placeholder={t("kyc.address.cityPlaceholder")}
                aria-invalid={Boolean(errors.city)}
                autoComplete="address-level2"
              />
            )}
          />
        </FormField>

        <FormField
          id="state"
          label={t("kyc.address.state")}
          error={t(errors.state?.message || "")}
          required
        >
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="state"
                placeholder={t("kyc.address.statePlaceholder")}
                aria-invalid={Boolean(errors.state)}
                autoComplete="address-level1"
              />
            )}
          />
        </FormField>

        <FormField
          id="postalCode"
          label={t("kyc.address.postalCode")}
          error={t(errors.postalCode?.message || "")}
          required
        >
          <Controller
            name="postalCode"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="postalCode"
                placeholder={t("kyc.address.postalCodePlaceholder")}
                aria-invalid={Boolean(errors.postalCode)}
                autoComplete="postal-code"
              />
            )}
          />
        </FormField>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-medium text-foreground">
            {t("kyc.address.proofDocument")}
          </p>
          <Controller
            name="proofDocumentFile"
            control={control}
            render={({ field }) => (
              <FileUpload
                value={field.value}
                onChange={(file) => {
                  field.onChange(file ?? undefined);
                }}
                error={errors.proofDocumentFile?.message}
              />
            )}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("kyc.address.proofDocumentHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
