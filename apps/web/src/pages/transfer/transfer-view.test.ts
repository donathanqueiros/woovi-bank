import assert from "node:assert/strict";
import test from "node:test";

import { getTransferSurfaceCopy } from "./transfer-view.ts";

test("prioritizes known recipients copy before a destination is chosen", () => {
  assert.deepEqual(
    getTransferSurfaceCopy({
      hasKnownRecipients: true,
      hasSelectedDestination: false,
      destinationLabel: "",
      loading: false,
      feedback: null,
      feedbackTone: "success",
    }),
    {
      destinationSummary: "Escolha um destinatario salvo para agilizar o envio.",
      statusLabel: "Pronto para revisar",
      statusDescription: "Confira destino, valor e descricao antes de confirmar a transferencia.",
    },
  );
});

test("highlights the selected destination when one is already chosen", () => {
  assert.deepEqual(
    getTransferSurfaceCopy({
      hasKnownRecipients: true,
      hasSelectedDestination: true,
      destinationLabel: "Maria (1234abcd)",
      loading: false,
      feedback: null,
      feedbackTone: "success",
    }),
    {
      destinationSummary: "Destino selecionado: Maria (1234abcd)",
      statusLabel: "Pronto para revisar",
      statusDescription: "Confira destino, valor e descricao antes de confirmar a transferencia.",
    },
  );
});

test("promotes the loading state over the default review state", () => {
  assert.deepEqual(
    getTransferSurfaceCopy({
      hasKnownRecipients: false,
      hasSelectedDestination: true,
      destinationLabel: "Conta manual",
      loading: true,
      feedback: null,
      feedbackTone: "success",
    }),
    {
      destinationSummary: "Destino selecionado: Conta manual",
      statusLabel: "Enviando transferencia",
      statusDescription: "Estamos processando a transferencia com a chave de idempotencia da sessao.",
    },
  );
});

test("promotes success feedback over review copy", () => {
  assert.deepEqual(
    getTransferSurfaceCopy({
      hasKnownRecipients: false,
      hasSelectedDestination: false,
      destinationLabel: "",
      loading: false,
      feedback: "Transferencia enviada com sucesso.",
      feedbackTone: "success",
    }),
    {
      destinationSummary: "Informe manualmente o ID completo da conta de destino.",
      statusLabel: "Envio concluido",
      statusDescription: "Transferencia enviada com sucesso.",
    },
  );
});

test("promotes error feedback over review copy", () => {
  assert.deepEqual(
    getTransferSurfaceCopy({
      hasKnownRecipients: false,
      hasSelectedDestination: false,
      destinationLabel: "",
      loading: false,
      feedback: "Informe a conta de destino.",
      feedbackTone: "error",
    }),
    {
      destinationSummary: "Informe manualmente o ID completo da conta de destino.",
      statusLabel: "Ajuste antes de enviar",
      statusDescription: "Informe a conta de destino.",
    },
  );
});
