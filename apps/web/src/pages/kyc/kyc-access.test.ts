import assert from "node:assert/strict";
import test from "node:test";

import { getKycActionCopy, getKycPageMode, KYC_ROUTE } from "./kyc-access.ts";

test("uses the profile kyc route", () => {
  assert.equal(KYC_ROUTE, "/profile/kyc");
});

test("shows readonly mode when kyc is under review or approved", () => {
  assert.equal(getKycPageMode("UNDER_REVIEW"), "readonly");
  assert.equal(getKycPageMode("APPROVED"), "readonly");
});

test("keeps editable mode when kyc still needs submission or resubmission", () => {
  assert.equal(getKycPageMode("PENDING_SUBMISSION"), "editable");
  assert.equal(getKycPageMode("REJECTED"), "editable");
  assert.equal(getKycPageMode(null), "editable");
});

test("uses view copy for readonly statuses", () => {
  assert.deepEqual(getKycActionCopy("UNDER_REVIEW"), {
    label: "Ver dados enviados",
    description: "Acompanhe sua verificacao com os dados ja enviados.",
  });
});

test("uses resubmission copy for rejected kyc", () => {
  assert.deepEqual(getKycActionCopy("REJECTED"), {
    label: "Reenviar verificacao",
    description: "Atualize seus dados para enviar uma nova analise.",
  });
});
