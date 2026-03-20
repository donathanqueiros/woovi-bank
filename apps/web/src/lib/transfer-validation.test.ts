import assert from "node:assert/strict";
import test from "node:test";

import { getTransferValidationMessage } from "./transfer-validation.ts";

test("returns an error when transfer amount is greater than available balance", () => {
  assert.equal(
    getTransferValidationMessage({
      amount: "150",
      balance: 100,
    }),
    "O valor da transferencia nao pode ser maior que o saldo disponivel.",
  );
});

test("allows transfer when amount is equal to available balance", () => {
  assert.equal(
    getTransferValidationMessage({
      amount: "100",
      balance: 100,
    }),
    null,
  );
});
