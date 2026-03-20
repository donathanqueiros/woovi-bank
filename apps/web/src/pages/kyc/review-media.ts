import type { KycFormData } from "./kyc-schemas.ts";

export type ReviewMediaLabels = {
  proofDocument: string;
  frontImage: string;
  backImage: string;
  selfie: string;
};

export type ReviewMediaItem =
  | {
      key: "proofDocumentFile" | "frontImageFile" | "backImageFile";
      title: string;
      kind: "file";
      file: File;
    }
  | {
      key: "selfieBase64";
      title: string;
      kind: "base64";
      src: string;
    };

function isPreviewableImage(file: File | undefined): file is File {
  return Boolean(file?.type.startsWith("image/"));
}

export function getReviewMediaItems(
  values: Partial<KycFormData>,
  labels: ReviewMediaLabels,
): ReviewMediaItem[] {
  const items: ReviewMediaItem[] = [];
  const proofDocumentFile = values.proofDocumentFile;
  const frontImageFile = values.frontImageFile;
  const backImageFile = values.backImageFile;

  if (isPreviewableImage(proofDocumentFile)) {
    items.push({
      key: "proofDocumentFile",
      title: labels.proofDocument,
      kind: "file",
      file: proofDocumentFile,
    });
  }

  if (isPreviewableImage(frontImageFile)) {
    items.push({
      key: "frontImageFile",
      title: labels.frontImage,
      kind: "file",
      file: frontImageFile,
    });
  }

  if (isPreviewableImage(backImageFile)) {
    items.push({
      key: "backImageFile",
      title: labels.backImage,
      kind: "file",
      file: backImageFile,
    });
  }

  if (values.selfieBase64) {
    items.push({
      key: "selfieBase64",
      title: labels.selfie,
      kind: "base64",
      src: values.selfieBase64,
    });
  }

  return items;
}
