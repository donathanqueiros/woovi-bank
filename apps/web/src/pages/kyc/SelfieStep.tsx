import { useTranslation } from "react-i18next";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { CameraCapture } from "@/components/ui/camera-capture";
import type { KycFormData } from "./kyc-schemas";

type SelfieStepProps = {
  control: Control<KycFormData>;
  errors: FieldErrors<KycFormData>;
};

export function SelfieStep({ control, errors }: SelfieStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-xl font-semibold text-foreground">
          {t("kyc.selfie.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("kyc.selfie.subtitle")}
        </p>
      </header>

      <Controller
        name="selfieBase64"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col items-center gap-2">
            <CameraCapture
              onCapture={(base64) => field.onChange(base64)}
              className="w-full"
            />
            {errors.selfieBase64 && (
              <p role="alert" className="text-xs text-destructive">
                {t("kyc.validation.selfieRequired")}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}
