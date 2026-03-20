import { useTranslation } from "react-i18next";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, CheckCircle2, Image as ImageIcon } from "lucide-react";
import type { KycFormData } from "./kyc-schemas";
import { cn } from "@/lib/utils";

type ReviewStepProps = {
  control: Control<KycFormData>;
  errors: FieldErrors<KycFormData>;
  getValues: UseFormGetValues<KycFormData>;
  onEditStep: (step: number) => void;
};

type ReviewSection = {
  title: string;
  step: number;
  rows: Array<{ label: string; value: string | undefined | null }>;
};

export function ReviewStep({
  control,
  errors,
  getValues,
  onEditStep,
}: ReviewStepProps) {
  const { t } = useTranslation();
  const values = getValues();

  const ID_TYPE_LABELS: Record<string, string> = {
    PASSPORT: t("kyc.identity.passport"),
    DRIVERS_LICENSE: t("kyc.identity.driversLicense"),
    RG: t("kyc.identity.rg"),
  };

  const sections: ReviewSection[] = [
    {
      title: t("kyc.review.personalInfo"),
      step: 0,
      rows: [
        { label: t("kyc.personalInfo.fullName"), value: values.fullName },
        { label: t("kyc.personalInfo.email"), value: values.email },
        { label: t("kyc.personalInfo.phone"), value: values.phone },
        { label: t("kyc.personalInfo.dateOfBirth"), value: values.dateOfBirth },
        { label: t("kyc.personalInfo.country"), value: values.country },
      ],
    },
    {
      title: t("kyc.review.address"),
      step: 1,
      rows: [
        { label: t("kyc.address.street"), value: values.street },
        { label: t("kyc.address.city"), value: values.city },
        { label: t("kyc.address.state"), value: values.state },
        { label: t("kyc.address.postalCode"), value: values.postalCode },
        {
          label: t("kyc.address.proofDocument"),
          value: values.proofDocumentBase64
            ? t("kyc.review.documentUploaded")
            : undefined,
        },
      ],
    },
    {
      title: t("kyc.review.identity"),
      step: 2,
      rows: [
        { label: t("kyc.identity.idType"), value: values.idType ? ID_TYPE_LABELS[values.idType] : undefined },
        { label: t("kyc.identity.idNumber"), value: values.idNumber },
        {
          label: t("kyc.identity.frontImage"),
          value: values.frontImageBase64
            ? t("kyc.review.documentUploaded")
            : undefined,
        },
        {
          label: t("kyc.identity.backImage"),
          value: values.backImageBase64
            ? t("kyc.review.documentUploaded")
            : undefined,
        },
      ],
    },
    {
      title: t("kyc.review.selfie"),
      step: 3,
      rows: [
        {
          label: t("kyc.review.selfie"),
          value: values.selfieBase64 ? t("kyc.review.selfieProvided") : undefined,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold text-foreground">
          {t("kyc.review.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("kyc.review.subtitle")}
        </p>
      </header>

      {/* Selfie preview */}
      {values.selfieBase64 && (
        <div className="flex items-center gap-3 rounded-xl border border-input p-3">
          <img
            src={values.selfieBase64}
            alt="Selfie"
            className="size-16 rounded-lg object-cover"
          />
          <div className="flex items-center gap-1.5 text-sm text-(--success)">
            <CheckCircle2 className="size-4" />
            {t("kyc.review.selfieProvided")}
          </div>
        </div>
      )}

      {/* Review sections */}
      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-input bg-card p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(section.step)}
                aria-label={`${t("kyc.navigation.edit")} ${section.title}`}
              >
                <Pencil className="mr-1.5 size-3.5" />
                {t("kyc.navigation.edit")}
              </Button>
            </div>

            <dl className="grid gap-2 sm:grid-cols-2">
              {section.rows
                .filter((row) => row.value)
                .map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="flex items-center gap-1 text-sm font-medium text-foreground">
                      {row.value && row.value.includes("enviado") || row.value?.includes("uploaded") ? (
                        <>
                          <ImageIcon className="size-3.5 text-(--success)" />
                          {row.value}
                        </>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
      </div>

      {/* Terms */}
      <div
        className={cn(
          "rounded-xl border p-4",
          errors.termsAccepted
            ? "border-destructive/60 bg-destructive/5"
            : "border-input",
        )}
      >
        <Controller
          name="termsAccepted"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="terms"
              checked={field.value === true}
              onChange={(e) => field.onChange(e.target.checked || undefined)}
              label={t("kyc.review.terms")}
            />
          )}
        />
        {errors.termsAccepted && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {t("kyc.review.termsRequired")}
          </p>
        )}
      </div>
    </div>
  );
}
