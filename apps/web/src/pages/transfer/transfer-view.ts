type TransferSurfaceCopyInput = {
  hasKnownRecipients: boolean;
  hasSelectedDestination: boolean;
  destinationLabel: string;
  loading: boolean;
  feedback: string | null;
  feedbackTone: "error" | "success";
};

type TransferSurfaceCopy = {
  destinationSummary: string;
  statusLabel: string;
  statusDescription: string;
};

export function getTransferSurfaceCopy({
  hasKnownRecipients,
  hasSelectedDestination,
  destinationLabel,
  loading,
  feedback,
  feedbackTone,
}: TransferSurfaceCopyInput): TransferSurfaceCopy {
  const destinationSummary = hasSelectedDestination
    ? `Destino selecionado: ${destinationLabel}`
    : hasKnownRecipients
      ? "Escolha um destinatario salvo para agilizar o envio."
      : "Informe manualmente o ID completo da conta de destino.";

  if (loading) {
    return {
      destinationSummary,
      statusLabel: "Enviando transferencia",
      statusDescription:
        "Estamos processando a transferencia com a chave de idempotencia da sessao.",
    };
  }

  if (feedback) {
    return {
      destinationSummary,
      statusLabel: feedbackTone === "error" ? "Ajuste antes de enviar" : "Envio concluido",
      statusDescription: feedback,
    };
  }

  return {
    destinationSummary,
    statusLabel: "Pronto para revisar",
    statusDescription: "Confira destino, valor e descricao antes de confirmar a transferencia.",
  };
}

export type { TransferSurfaceCopy, TransferSurfaceCopyInput };
