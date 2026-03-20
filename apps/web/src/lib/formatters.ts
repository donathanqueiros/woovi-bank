export function parseDateValue(value: string) {
  const ts = Number(value);
  return Number.isFinite(ts) ? ts : Date.parse(value);
}

export function formatBalance(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(isoString: string) {
  const date = new Date(parseDateValue(isoString));
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(isoString: string) {
  const date = new Date(parseDateValue(isoString));
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function newIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
