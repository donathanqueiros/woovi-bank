type TransferValidationInput = {
  amount: string;
  balance: number | null | undefined;
};

export function getTransferValidationMessage({
  amount,
  balance,
}: TransferValidationInput): string | null {
  const numericAmount = Number(amount);
  const availableBalance = balance ?? 0;

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null;
  }

  if (numericAmount > availableBalance) {
    return "O valor da transferencia nao pode ser maior que o saldo disponivel.";
  }

  return null;
}
