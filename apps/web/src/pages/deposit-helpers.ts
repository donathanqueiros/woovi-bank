const MIN_DEPOSIT_EXPIRATION_MS = 5 * 60 * 1000;
const DEFAULT_DEPOSIT_EXPIRATION_MS = 24 * 60 * 60 * 1000;

function padDateSegment(value: number) {
  return String(value).padStart(2, "0");
}

export function getDefaultDepositExpirationValue(now: Date) {
  const expiration = new Date(now.getTime() + DEFAULT_DEPOSIT_EXPIRATION_MS);

  return `${expiration.getFullYear()}-${padDateSegment(expiration.getMonth() + 1)}-${padDateSegment(
    expiration.getDate(),
  )}T${padDateSegment(expiration.getHours())}:${padDateSegment(expiration.getMinutes())}`;
}

export function getDepositExpirationValidationMessage(expiresAtValue: string, now: Date) {
  const parsedExpiration = new Date(expiresAtValue);

  if (Number.isNaN(parsedExpiration.getTime())) {
    return "Informe um vencimento valido.";
  }

  if (parsedExpiration.getTime() - now.getTime() < MIN_DEPOSIT_EXPIRATION_MS) {
    return "Escolha um vencimento com pelo menos 5 minutos de antecedencia.";
  }

  return null;
}
