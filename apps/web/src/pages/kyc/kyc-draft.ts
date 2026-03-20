import type { KycFormData } from "./kyc-schemas.ts";

type KycDraft = Partial<Omit<
  KycFormData,
  "frontImageFile" | "backImageFile" | "proofDocumentFile"
>>;

export function serializeKycDraft(values: Partial<KycFormData>): KycDraft {
  const {
    frontImageFile,
    backImageFile,
    proofDocumentFile,
    ...persistedValues
  } = values;

  void frontImageFile;
  void backImageFile;
  void proofDocumentFile;

  return persistedValues;
}
