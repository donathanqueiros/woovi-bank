import assert from "node:assert/strict";
import test from "node:test";
import { getDefaultDepositExpirationValue, getDepositExpirationValidationMessage } from "./deposit-helpers";



test("uses a default expiration 24 hours ahead in local datetime format", () => {
  assert.equal(
    getDefaultDepositExpirationValue(new Date("2026-03-20T10:15:00")),
    "2026-03-21T10:15",
  );
});

test("requires a valid expiration date", () => {
  assert.equal(
    getDepositExpirationValidationMessage("data-invalida", new Date("2026-03-20T10:15:00")),
    "Informe um vencimento valido.",
  );
});

test("requires at least five minutes of advance for expiration", () => {
  assert.equal(
    getDepositExpirationValidationMessage(
      "2026-03-20T10:18",
      new Date("2026-03-20T10:15:00"),
    ),
    "Escolha um vencimento com pelo menos 5 minutos de antecedencia.",
  );
});

test("accepts expiration dates after the minimum window", () => {
  assert.equal(
    getDepositExpirationValidationMessage(
      "2026-03-20T10:25",
      new Date("2026-03-20T10:15:00"),
    ),
    null,
  );
});
