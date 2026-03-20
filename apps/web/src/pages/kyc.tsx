import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { serializeKycDraft } from "./kyc/kyc-draft";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/use-auth";
import { getKycActionCopy, getKycPageMode, KYC_ROUTE } from "./kyc/kyc-access";
import type { KycStatus } from "@/lib/auth-storage";

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

const MY_KYC_QUERY = `
  query MyKyc {
    myKyc {
      id
      status
      submittedAt
      reviewNotes
      personalInfo {
        fullName
        email
        phone
        dateOfBirth
        country
      }
      address {
        street
        city
        state
        postalCode
      }
      identity {
        idType
        idNumber
      }
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

const kycStatusLabel: Record<string, string> = {
  PENDING_SUBMISSION: "Nao iniciado",
  UNDER_REVIEW: "Em analise",
  REJECTED: "Rejeitado",
  APPROVED: "Aprovado",
};

const kycStatusVariant: Record<string, "warning" | "info" | "destructive" | "success"> = {
  PENDING_SUBMISSION: "warning",
  UNDER_REVIEW: "info",
  REJECTED: "destructive",
  APPROVED: "success",
};

const idTypeLabel: Record<string, string> = {
  PASSPORT: "Passaporte",
  DRIVERS_LICENSE: "CNH",
  RG: "RG",
};

function formatSubmittedAt(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("pt-BR");
}

type MyKycData = {
  myKyc: {
    id: string;
    status: KycStatus;
    submittedAt: string | null;
    reviewNotes: string | null;
    personalInfo?: {
      fullName?: string | null;
      email?: string | null;
      phone?: string | null;
      dateOfBirth?: string | null;
      country?: string | null;
    } | null;
    address?: {
      street?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
    } | null;
    identity?: {
      idType?: string | null;
      idNumber?: string | null;
    } | null;
  } | null;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function KycPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingKyc, setIsLoadingKyc] = useState(false);
  const [submittedKyc, setSubmittedKyc] = useState<MyKycData["myKyc"]>(null);
  const [kycLoadError, setKycLoadError] = useState<string | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageMode = getKycPageMode(user?.kycStatus);
  const kycAction = getKycActionCopy(user?.kycStatus);

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

  useEffect(() => {
    const subscription = watch((values) => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify(serializeKycDraft(values as KycFormData)),
        );
      }, 500);
    });

    return () => {
      subscription.unsubscribe();
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [watch]);

  useEffect(() => {
    if (pageMode !== "readonly") {
      setSubmittedKyc(null);
      setKycLoadError(null);
      setIsLoadingKyc(false);
      return;
    }

    let active = true;

    setIsLoadingKyc(true);
    setKycLoadError(null);

    void graphqlRequest<MyKycData>(MY_KYC_QUERY, {})
      .then((data) => {
        if (!active) {
          return;
        }

        setSubmittedKyc(data.myKyc);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setKycLoadError(
          error instanceof Error ? error.message : "Nao foi possivel carregar os dados do KYC.",
        );
      })
      .finally(() => {
        if (active) {
          setIsLoadingKyc(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pageMode]);

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
      const [proofDocumentBase64, frontImageBase64, backImageBase64] =
        await Promise.all([
          data.proofDocumentFile
            ? fileToBase64(data.proofDocumentFile)
            : Promise.resolve(null),
          data.frontImageFile
            ? fileToBase64(data.frontImageFile)
            : Promise.resolve(null),
          data.backImageFile
            ? fileToBase64(data.backImageFile)
            : Promise.resolve(null),
        ]);

      const response = await graphqlRequest<{
        SubmitKyc: {
          id: string;
          status: KycStatus;
        };
      }>(SUBMIT_KYC_MUTATION, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        country: data.country,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        proofDocumentBase64,
        proofDocumentMimeType: data.proofDocumentFile?.type ?? null,
        idType: data.idType,
        idNumber: data.idNumber,
        frontImageBase64,
        backImageBase64,
        selfieBase64: data.selfieBase64,
      });

      localStorage.removeItem(DRAFT_KEY);
      if (user) {
        setUser({
          ...user,
          kycStatus: response.SubmitKyc.status,
        });
      }
      toast.success(t("kyc.success.title"), {
        description: t("kyc.success.description"),
      });
      navigate(KYC_ROUTE);
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

  if (pageMode === "readonly") {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="rounded-[28px] border border-border/70 bg-card px-6 py-7 shadow-sm sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  KYC
                </Badge>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                    Dados enviados para verificacao
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {kycAction.description}
                  </p>
                </div>
                {user?.kycStatus ? (
                  <Badge variant={kycStatusVariant[user.kycStatus] ?? "secondary"}>
                    {kycStatusLabel[user.kycStatus] ?? user.kycStatus}
                  </Badge>
                ) : null}
              </div>

              <div className="flex size-14 items-center justify-center rounded-[20px] bg-primary/10 text-primary">
                <ShieldCheck className="size-7" />
              </div>
            </div>
          </section>

          {isLoadingKyc ? (
            <section className="rounded-[24px] border border-border/70 bg-card p-6 text-sm text-muted-foreground">
              Carregando os dados enviados...
            </section>
          ) : null}

          {!isLoadingKyc && kycLoadError ? (
            <section className="rounded-[24px] border border-destructive/25 bg-card p-6 text-sm text-destructive">
              {kycLoadError}
            </section>
          ) : null}

          {!isLoadingKyc && !kycLoadError && submittedKyc ? (
            <div className="grid gap-4">
              <article className="rounded-[24px] border border-border/70 bg-card p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Resumo da solicitacao</h2>
                    <p className="text-sm text-muted-foreground">
                      Revise os dados atualmente registrados para sua conta.
                    </p>
                  </div>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ReadonlyField label="Status" value={kycStatusLabel[submittedKyc.status]} />
                  <ReadonlyField
                    label="Enviado em"
                    value={formatSubmittedAt(submittedKyc.submittedAt)}
                  />
                  <ReadonlyField label="Observacoes" value={submittedKyc.reviewNotes ?? "Sem observacoes"} />
                </dl>
              </article>

              <article className="rounded-[24px] border border-border/70 bg-card p-6">
                <h2 className="text-lg font-medium text-foreground">Dados pessoais</h2>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ReadonlyField label="Nome completo" value={submittedKyc.personalInfo?.fullName} />
                  <ReadonlyField label="Email" value={submittedKyc.personalInfo?.email} />
                  <ReadonlyField label="Telefone" value={submittedKyc.personalInfo?.phone} />
                  <ReadonlyField label="Data de nascimento" value={submittedKyc.personalInfo?.dateOfBirth} />
                  <ReadonlyField label="Pais" value={submittedKyc.personalInfo?.country} />
                </dl>
              </article>

              <article className="rounded-[24px] border border-border/70 bg-card p-6">
                <h2 className="text-lg font-medium text-foreground">Endereco</h2>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ReadonlyField label="Rua" value={submittedKyc.address?.street} />
                  <ReadonlyField label="Cidade" value={submittedKyc.address?.city} />
                  <ReadonlyField label="Estado" value={submittedKyc.address?.state} />
                  <ReadonlyField label="CEP" value={submittedKyc.address?.postalCode} />
                </dl>
              </article>

              <article className="rounded-[24px] border border-border/70 bg-card p-6">
                <h2 className="text-lg font-medium text-foreground">Documento</h2>
                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <ReadonlyField
                    label="Tipo de documento"
                    value={submittedKyc.identity?.idType ? (idTypeLabel[submittedKyc.identity.idType] ?? submittedKyc.identity.idType) : undefined}
                  />
                  <ReadonlyField label="Numero do documento" value={submittedKyc.identity?.idNumber} />
                </dl>
              </article>
            </div>
          ) : null}

          {!isLoadingKyc && !kycLoadError && !submittedKyc ? (
            <section className="rounded-[24px] border border-border/70 bg-card p-6 text-sm text-muted-foreground">
              Nenhum dado de KYC foi encontrado para esta conta no momento.
            </section>
          ) : null}

          <div className="flex justify-start">
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Voltar ao perfil
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
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

        <StepIndicator steps={stepsConfig} className="mb-8" />

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

function ReadonlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-[20px] border border-border/70 bg-background/80 p-4">
      <dt className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-foreground">{value || "-"}</dd>
    </div>
  );
}
