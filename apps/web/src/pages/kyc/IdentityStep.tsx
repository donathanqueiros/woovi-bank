import { useTranslation } from "react-i18next";
import {
  Controller,
  type Control,
  type FieldErrors,
  useWatch,
} from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import type { KycFormData } from "./kyc-schemas";

type IdentityStepProps = {
  control: Control<KycFormData>;
  errors: FieldErrors<KycFormData>;
};

export function IdentityStep({ control, errors }: IdentityStepProps) {
  const { t } = useTranslation();
  const idType = useWatch({ control, name: "idType" });

  // Passport does not need back photo
  const needsBackImage = idType === "RG" || idType === "DRIVERS_LICENSE";
  // Keep the label aligned with selected document type.
  const idNumberLabel =
    idType === "RG"
      ? t("kyc.identity.rgOrCpf")
      : idType === "DRIVERS_LICENSE"
        ? t("kyc.identity.cpf")
        : t("kyc.identity.idNumber");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold text-foreground">
          {t("kyc.identity.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("kyc.identity.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="idType"
          label={t("kyc.identity.idType")}
          error={t(errors.idType?.message || "")}
          required
        >
          <Controller
            name="idType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="idType"
                aria-invalid={Boolean(errors.idType)}
              >
                <option value="">{t("kyc.identity.idTypePlaceholder")}</option>
                <option value="PASSPORT">{t("kyc.identity.passport")}</option>
                <option value="DRIVERS_LICENSE">
                  {t("kyc.identity.driversLicense")}
                </option>
                <option value="RG">{t("kyc.identity.rg")}</option>
              </Select>
            )}
          />
        </FormField>

        <FormField
          id="idNumber"
          label={idNumberLabel}
          error={t(errors.idNumber?.message || "")}
          hint={
            idType === "RG" || idType === "DRIVERS_LICENSE"
              ? "Ex: 123.456.789-09"
              : undefined
          }
          required
        >
          <Controller
            name="idNumber"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="idNumber"
                placeholder={t("kyc.identity.idNumberPlaceholder")}
                aria-invalid={Boolean(errors.idNumber)}
              />
            )}
          />
        </FormField>

        <div className="sm:col-span-2">
          <p className="mb-1.5 text-sm font-medium text-foreground">
            {t("kyc.identity.frontImage")}{" "}
          </p>
          <Controller
            name="frontImageFile"
            control={control}
            render={({ field }) => (
              <FileUpload
                accept="image/jpeg,image/png"
                value={field.value}
                onChange={field.onChange}
                error={t(errors.frontImageFile?.message || "")}
              />
            )}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("kyc.identity.frontImageHint")}
          </p>
        </div>

        {needsBackImage && (
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-foreground">
              {t("kyc.identity.backImage")}
            </p>
            <Controller
              name="backImageFile"
              control={control}
              render={({ field }) => (
                <FileUpload
                  accept="image/jpeg,image/png"
                  value={field.value}
                  onChange={field.onChange}
                  error={t(errors.backImageFile?.message || "")}
                />
              )}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("kyc.identity.backImageHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
