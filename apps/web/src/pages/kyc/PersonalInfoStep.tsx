import { useTranslation } from "react-i18next";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { KycFormData } from "./kyc-schemas";

const COUNTRIES = [
  { code: "BR", label: "Brasil" },
  { code: "US", label: "United States" },
  { code: "PT", label: "Portugal" },
  { code: "AR", label: "Argentina" },
  { code: "CL", label: "Chile" },
  { code: "CO", label: "Colombia" },
  { code: "MX", label: "México" },
  { code: "OTHER", label: "Outro" },
];

type PersonalInfoStepProps = {
  control: Control<KycFormData>;
  errors: FieldErrors<KycFormData>;
};

export function PersonalInfoStep({ control, errors }: PersonalInfoStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold text-foreground">
          {t("kyc.personalInfo.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("kyc.personalInfo.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="fullName"
          label={t("kyc.personalInfo.fullName")}
          error={t(errors.fullName?.message || "")}
          required
          className="sm:col-span-2"
        >
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="fullName"
                placeholder={t("kyc.personalInfo.fullNamePlaceholder")}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={
                  errors.fullName ? "fullName-error" : undefined
                }
                autoComplete="name"
              />
            )}
          />
        </FormField>

        <FormField
          id="email"
          label={t("kyc.personalInfo.email")}
          error={t(errors.email?.message || "")}
          required
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="email"
                type="email"
                placeholder={t("kyc.personalInfo.emailPlaceholder")}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                autoComplete="email"
              />
            )}
          />
        </FormField>

        <FormField
          id="phone"
          label={t("kyc.personalInfo.phone")}
          error={t(errors.phone?.message || "")}
          hint="+55 11 99999-9999"
          required
        >
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="phone"
                type="tel"
                placeholder={t("kyc.personalInfo.phonePlaceholder")}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                autoComplete="tel"
              />
            )}
          />
        </FormField>

        <FormField
          id="dateOfBirth"
          label={t("kyc.personalInfo.dateOfBirth")}
          error={t(errors.dateOfBirth?.message || "")}
          required
        >
          <Controller
            name="dateOfBirth"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="dateOfBirth"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                aria-invalid={Boolean(errors.dateOfBirth)}
                aria-describedby={
                  errors.dateOfBirth ? "dateOfBirth-error" : undefined
                }
                autoComplete="bday"
              />
            )}
          />
        </FormField>

        <FormField
          id="country"
          label={t("kyc.personalInfo.country")}
          error={t(errors.country?.message || "")}
          required
        >
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="country"
                aria-invalid={Boolean(errors.country)}
                aria-describedby={errors.country ? "country-error" : undefined}
              >
                <option value="">
                  {t("kyc.personalInfo.countryPlaceholder")}
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          />
        </FormField>
      </div>
    </div>
  );
}
