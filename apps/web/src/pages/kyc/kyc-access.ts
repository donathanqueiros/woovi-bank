import type { KycStatus } from "@/lib/auth-storage";

export const KYC_ROUTE = "/profile/kyc";

export type KycPageMode = "editable" | "readonly";

export function getKycPageMode(status?: KycStatus | null): KycPageMode {
  if (status === "UNDER_REVIEW" || status === "APPROVED") {
    return "readonly";
  }

  return "editable";
}

export function getKycActionCopy(status?: KycStatus | null) {
  if (status === "UNDER_REVIEW" || status === "APPROVED") {
    return {
      label: "Ver dados enviados",
      description: "Acompanhe sua verificacao com os dados ja enviados.",
    };
  }

  if (status === "REJECTED") {
    return {
      label: "Reenviar verificacao",
      description: "Atualize seus dados para enviar uma nova analise.",
    };
  }

  return {
    label: "Verificar identidade",
    description: "Envie seus dados para liberar todos os recursos operacionais.",
  };
}
