import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/kyc/step-indicator";
import { PersonalInfoStep } from "./kyc/PersonalInfoStep";
import { AddressStep } from "./kyc/AddressStep";
import { IdentityStep } from "./kyc/IdentityStep";
import { SelfieStep } from "./kyc/SelfieStep";
import { ReviewStep } from "./kyc/ReviewStep";
import {
  kycSchema,
  personalInfoSchema,
  addressSchema,
  identitySchema,
  selfieSchema,
  reviewSchema,
  type KycFormData,
} from "./kyc/kyc-schemas";
import { graphqlRequest } from "@/lib/graphqlClient";

const DRAFT_KEY = "kyc-draft";
const TOTAL_STEPS = 5;

const STEP_SCHEMAS = [
  personalInfoSchema,
  addressSchema,
  identitySchema,
  selfieSchema,
  reviewSchema,
];

const SUBMIT_KYC_MUTATION = `
  mutation SubmitKyc(
    $fullName: String!
    $email: String!
    $phone: String!
    $dateOfBirth: String!
    $country: String!
    $street: String!
    $city: String!
    $state: String!
    $postalCode: String!
    $proofDocumentBase64: String
    $proofDocumentMimeType: String
    $idType: String!
    $idNumber: String!
    $frontImageBase64: String!
    $backImageBase64: String
    $selfieBase64: String!
  ) {
    SubmitKyc(
      fullName: $fullName
      email: $email
      phone: $phone
      dateOfBirth: $dateOfBirth
      country: $country
      street: $street
      city: $city
      state: $state
      postalCode: $postalCode
      proofDocumentBase64: $proofDocumentBase64
      proofDocumentMimeType: $proofDocumentMimeType
      idType: $idType
      idNumber: $idNumber
      frontImageBase64: $frontImageBase64
      backImageBase64: $backImageBase64
      selfieBase64: $selfieBase64
    ) {
      id
      status
    }
  }
`;

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export default function KycPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
    mode: "onChange",
    defaultValues: (() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<KycFormData>;
          return parsed;
        }
      } catch {
        // ignore
      }
      return {};
    })(),
  });

  // Auto-save draft to localStorage with debounce
  useEffect(() => {
    const subscription = watch((values) => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        // Don't persist base64 blobs to avoid quota issues – keep only text
        const { selfieBase64, frontImageBase64, backImageBase64, proofDocumentBase64, ...textValues } =
          values as KycFormData;
        void selfieBase64;
        void frontImageBase64;
        void backImageBase64;
        void proofDocumentBase64;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(textValues));
      }, 500);
    });

    return () => {
      subscription.unsubscribe();
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [watch]);

  const stepLabels = [
    t("kyc.steps.personalInfo"),
    t("kyc.steps.address"),
    t("kyc.steps.identity"),
    t("kyc.steps.selfie"),
    t("kyc.steps.review"),
  ];

  const stepsConfig = stepLabels.map((label, i) => ({
    label,
    status:
      i < currentStep
        ? ("completed" as const)
        : i === currentStep
          ? ("active" as const)
          : ("pending" as const),
  }));

  const goToStep = useCallback((step: number, dir: number) => {
    setDirection(dir);
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleNext = useCallback(async () => {
    const schema = STEP_SCHEMAS[currentStep];
    if (!schema) return;

    // Validate only the current step's fields
    const fieldNames = Object.keys(schema.shape ?? {}) as Array<keyof KycFormData>;
    const valid = await trigger(fieldNames);
    if (!valid) return;

    goToStep(currentStep + 1, 1);
  }, [currentStep, trigger, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) goToStep(currentStep - 1, -1);
  }, [currentStep, goToStep]);

  const handleEditStep = useCallback(
    (step: number) => {
      goToStep(step, -1);
    },
    [goToStep],
  );

  const onSubmit = handleSubmit(async (data: KycFormData) => {
    setIsSubmitting(true);
    try {
      await graphqlRequest(SUBMIT_KYC_MUTATION, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        country: data.country,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        proofDocumentBase64: data.proofDocumentBase64 ?? null,
        proofDocumentMimeType: data.proofDocumentMimeType ?? null,
        idType: data.idType,
        idNumber: data.idNumber,
        frontImageBase64: data.frontImageBase64,
        backImageBase64: data.backImageBase64 ?? null,
        selfieBase64: data.selfieBase64,
      });

      localStorage.removeItem(DRAFT_KEY);
      toast.success(t("kyc.success.title"), {
        description: t("kyc.success.description"),
      });
      navigate("/accounts");
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("kyc.error.submit");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  });

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const stepComponents = [
    <PersonalInfoStep key="personal" control={control} errors={errors} />,
    <AddressStep key="address" control={control} errors={errors} />,
    <IdentityStep key="identity" control={control} errors={errors} />,
    <SelfieStep key="selfie" control={control} errors={errors} />,
    <ReviewStep
      key="review"
      control={control}
      errors={errors}
      getValues={getValues}
      onEditStep={handleEditStep}
    />,
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Woovi Bank
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
            {t("kyc.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("kyc.subtitle")}
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator steps={stepsConfig} className="mb-8" />

        {/* Step content with Framer Motion transitions */}
        <form onSubmit={onSubmit} noValidate>
          <div className="relative overflow-hidden rounded-2xl border border-input bg-card p-6 shadow-sm sm:p-8">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {stepComponents[currentStep]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="min-h-11 sm:min-w-30"
            >
              {t("kyc.navigation.back")}
            </Button>

            {isLastStep ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-h-11 sm:min-w-40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {t("kyc.navigation.submitting")}
                  </>
                ) : (
                  t("kyc.navigation.submit")
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void handleNext()}
                className="min-h-11 sm:min-w-30"
              >
                {t("kyc.navigation.next")}
              </Button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
