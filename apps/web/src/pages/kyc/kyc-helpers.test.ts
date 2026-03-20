import test from "node:test";
import assert from "node:assert/strict";

import { serializeKycDraft } from "./kyc-draft.ts";
import { getReviewMediaItems } from "./review-media.ts";

test("serializeKycDraft keeps selfie data and removes uploaded files", () => {
  const proofDocumentFile = new File(["proof"], "proof.png", {
    type: "image/png",
  });
  const frontImageFile = new File(["front"], "front.png", {
    type: "image/png",
  });
  const backImageFile = new File(["back"], "back.png", {
    type: "image/png",
  });

  const draft = serializeKycDraft({
    fullName: "Jane Doe",
    selfieBase64: "data:image/jpeg;base64,selfie",
    frontImageFile,
    backImageFile,
    proofDocumentFile,
    termsAccepted: true,
  });

  assert.deepEqual(draft, {
    fullName: "Jane Doe",
    selfieBase64: "data:image/jpeg;base64,selfie",
    termsAccepted: true,
  });
});

test("getReviewMediaItems returns previews only for image uploads and selfie", () => {
  const proofDocumentFile = new File(["proof"], "statement.pdf", {
    type: "application/pdf",
  });
  const frontImageFile = new File(["front"], "front.png", {
    type: "image/png",
  });
  const backImageFile = new File(["back"], "back.jpg", {
    type: "image/jpeg",
  });

  const items = getReviewMediaItems(
    {
      proofDocumentFile,
      frontImageFile,
      backImageFile,
      selfieBase64: "data:image/jpeg;base64,selfie",
    },
    {
      proofDocument: "Proof of address",
      frontImage: "Front of document",
      backImage: "Back of document",
      selfie: "Selfie",
    },
  );

  assert.deepEqual(
    items.map((item) => ({
      key: item.key,
      title: item.title,
      kind: item.kind,
    })),
    [
      {
        key: "frontImageFile",
        title: "Front of document",
        kind: "file",
      },
      {
        key: "backImageFile",
        title: "Back of document",
        kind: "file",
      },
      {
        key: "selfieBase64",
        title: "Selfie",
        kind: "base64",
      },
    ],
  );
});
