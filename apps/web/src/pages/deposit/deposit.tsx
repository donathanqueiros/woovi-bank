import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Copy, QrCode, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCOUNT_DEPOSIT_CONFIRMED_EVENT } from "@/lib/account-notification-events";
import { formatBalance, formatDateTime } from "@/lib/formatters";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/use-auth";
import {
  getDefaultDepositExpirationValue,
  getDepositExpirationValidationMessage,
} from "./deposit-helpers";

const ACCOUNT_QUERY = `
  query DepositAccount($id: ID!) {
    account(id: $id) {
      id
      holderName
      balance
    }
  }
`;

const DEPOSITS_QUERY = `
  query Deposits($page: Int!, $limit: Int!, $status: DepositRequestStatus) {
    myDepositsCount(status: $status)
    myDeposits(page: $page, limit: $limit, status: $status) {
      id
      accountId
      correlationID
      requestedAmount
      paidAmount
      status
      brCode
      qrCodeImage
      expiresDate
      createdAt
      completedAt
      expiredAt
    }
  }
`;

const CREATE_DEPOSIT_MUTATION = `
  mutation CreateDeposit($amount: Float!, $comment: String, $expiresDate: String) {
    CreateDeposit(amount: $amount, comment: $comment, expiresDate: $expiresDate) {
      id
      accountId
      correlationID
      requestedAmount
      paidAmount
      status
      brCode
      qrCodeImage
      expiresDate
      createdAt
      completedAt
      expiredAt
    }
  }
`;

const CANCEL_LATEST_DEPOSIT_MUTATION = `
  mutation CancelLatestDeposit {
    CancelLatestDeposit {
      id
      status
      expiredAt
    }
  }
`;

type Account = {
  id: string;
  holderName: string;
  balance: number | null;
};

type DepositStatus = "PENDING" | "COMPLETED" | "EXPIRED" | "CANCELED";

type Deposit = {
  id: string;
  accountId: string;
  correlationID: string;
  requestedAmount: number;
  paidAmount?: number | null;
  status: DepositStatus;
  brCode?: string | null;
  qrCodeImage?: string | null;
  expiresDate?: string | null;
  createdAt: string;
  completedAt?: string | null;
  expiredAt?: string | null;
};

const QUICK_DEPOSIT_AMOUNTS = ["50", "100", "200", "500"] as const;

function getDepositStatusLabel(status: DepositStatus) {
  if (status === "COMPLETED") return "Confirmado";
  if (status === "EXPIRED") return "Expirado";
  if (status === "CANCELED") return "Cancelado";
  return "Aguardando pagamento";
}

export default function DepositPage() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [depositsTotalCount, setDepositsTotalCount] = useState(0);
  const [depositAmount, setDepositAmount] = useState("100");
  const [depositExpiresAt, setDepositExpiresAt] = useState(() =>
    getDefaultDepositExpirationValue(new Date()),
  );
  const [loading, setLoading] = useState(true);
  const [depositLoading, setDepositLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"error" | "success">("success");

  const loadDepositData = useCallback(async () => {
    if (!user?.accountId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [accountData, depositsData] = await Promise.all([
        graphqlRequest<{ account: Account | null }>(ACCOUNT_QUERY, { id: user.accountId }),
        graphqlRequest<{ myDeposits: Deposit[]; myDepositsCount: number }>(DEPOSITS_QUERY, {
          page: 1,
          limit: 5,
          status: undefined,
        }),
      ]);

      setAccount(accountData.account ?? null);
      setDeposits(depositsData.myDeposits ?? []);
      setDepositsTotalCount(depositsData.myDepositsCount ?? 0);
    } catch (err) {
      setFeedbackTone("error");
      setFeedback(err instanceof Error ? err.message : "Falha ao carregar depositos");
    } finally {
      setLoading(false);
    }
  }, [user?.accountId]);

  useEffect(() => {
    void loadDepositData();
  }, [loadDepositData]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleDepositConfirmed = () => {
      void loadDepositData();
    };

    window.addEventListener(ACCOUNT_DEPOSIT_CONFIRMED_EVENT, handleDepositConfirmed);

    return () => {
      window.removeEventListener(ACCOUNT_DEPOSIT_CONFIRMED_EVENT, handleDepositConfirmed);
    };
  }, [loadDepositData]);

  const latestDeposit = useMemo(() => deposits[0] ?? null, [deposits]);

  async function handleCreateDeposit() {
    const amount = Number(depositAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedbackTone("error");
      setFeedback("Informe um valor de deposito valido.");
      return;
    }

    const expirationValidationMessage = getDepositExpirationValidationMessage(
      depositExpiresAt,
      new Date(),
    );

    if (expirationValidationMessage) {
      setFeedbackTone("error");
      setFeedback(expirationValidationMessage);
      return;
    }

    setDepositLoading(true);
    setFeedback(null);

    try {
      await graphqlRequest(CREATE_DEPOSIT_MUTATION, {
        amount,
        expiresDate: new Date(depositExpiresAt).toISOString(),
      });
      setFeedbackTone("success");
      setFeedback("Deposito Pix gerado com sucesso.");
      setDepositExpiresAt(getDefaultDepositExpirationValue(new Date()));
      await loadDepositData();
    } catch (err) {
      setFeedbackTone("error");
      setFeedback(err instanceof Error ? err.message : "Falha ao gerar deposito");
    } finally {
      setDepositLoading(false);
    }
  }

  async function handleCancelLatestDeposit() {
    setCancelLoading(true);
    setFeedback(null);

    try {
      await graphqlRequest(CANCEL_LATEST_DEPOSIT_MUTATION, {});
      setFeedbackTone("success");
      setFeedback("Ultimo deposito cancelado com sucesso.");
      await loadDepositData();
    } catch (err) {
      setFeedbackTone("error");
      setFeedback(err instanceof Error ? err.message : "Falha ao cancelar deposito");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleCopyBrCode(brCode: string) {
    try {
      await navigator.clipboard.writeText(brCode);
      toast.success("Codigo Pix copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o codigo Pix.");
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <section className="rounded-[24px] border border-border/70 bg-card px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Deposito dedicado
            </Badge>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">Deposito Pix</h1>
              <Badge variant="outline">Pix apenas</Badge>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Gere uma cobranca Pix, defina o vencimento, copie o Pix QR Code e acompanhe as
              confirmacoes em uma tela exclusiva.
            </p>
          </div>
          <div className="grid w-full gap-2 rounded-[20px] border border-border/70 bg-background/80 px-4 py-3 sm:max-w-72">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Saldo da conta
            </p>
            <p className="text-2xl font-semibold tracking-[-0.04em]">
              {formatBalance(account?.balance ?? 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              {account?.holderName ?? "Conta atual"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[24px] border border-border/70 bg-card p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Gerar novo deposito</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                No momento, a entrada de saldo acontece apenas por Pix. Informe o valor e o
                vencimento para gerar um novo QR Code.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:mt-6">
            <label className="space-y-2 text-sm font-medium">
              <span>Valor do deposito</span>
              <Input
                type="number"
                min={0.01}
                step="0.01"
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_DEPOSIT_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={depositAmount === value ? "default" : "outline"}
                  size="sm"
                  className="min-w-16"
                  onClick={() => setDepositAmount(value)}
                >
                  R$ {value}
                </Button>
              ))}
            </div>

            <label className="space-y-2 text-sm font-medium">
              <span>Vencimento</span>
              <Input
                type="datetime-local"
                value={depositExpiresAt}
                onChange={(event) => setDepositExpiresAt(event.target.value)}
              />
              <p className="text-xs leading-5 text-muted-foreground">
                O vencimento minimo aceito e de 5 minutos a partir de agora.
              </p>
            </label>

            {feedback ? (
              <p
                className={
                  feedbackTone === "error"
                    ? "rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                    : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                }
              >
                {feedback}
              </p>
            ) : null}

            <div className="flex justify-stretch sm:justify-end">
              <Button
                onClick={() => void handleCreateDeposit()}
                disabled={depositLoading || cancelLoading || loading}
                className="w-full sm:w-auto"
              >
                {depositLoading ? "Gerando..." : "Gerar deposito Pix"}
              </Button>
            </div>
          </div>
        </article>

        <article className="rounded-[24px] border border-border/70 bg-card p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <QrCode className="size-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Ultimo deposito gerado</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                O QR Code mais recente fica em destaque para acelerar copia, leitura e
                acompanhamento.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-[20px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Carregando dados de deposito...
            </div>
          ) : latestDeposit ? (
            <div className="mt-5 grid gap-4 rounded-[22px] border border-border/70 bg-background/80 p-4 md:mt-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="order-2 space-y-4 md:order-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{getDepositStatusLabel(latestDeposit.status)}</Badge>
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="size-3.5" />
                      {formatDateTime(latestDeposit.createdAt)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-foreground">
                    Valor solicitado: <strong>{formatBalance(latestDeposit.requestedAmount)}</strong>
                  </p>
                  {latestDeposit.expiresDate ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Vencimento: <strong>{formatDateTime(latestDeposit.expiresDate)}</strong>
                    </p>
                  ) : null}
                  {latestDeposit.paidAmount ? (
                    <p className="mt-2 text-sm text-emerald-700">
                      Valor confirmado: <strong>{formatBalance(latestDeposit.paidAmount)}</strong>
                    </p>
                  ) : null}
                </div>

                {latestDeposit.status === "PENDING" ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleCancelLatestDeposit()}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? "Cancelando..." : "Cancelar ultimo deposito"}
                  </Button>
                ) : null}

                {latestDeposit.brCode && latestDeposit.status === "PENDING" ? (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Pix QR Code
                    </p>
                    <textarea
                      className="h-28 w-full rounded-xl border border-border/70 bg-card px-3 py-2 font-mono text-xs text-foreground"
                      value={latestDeposit.brCode}
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => void handleCopyBrCode(latestDeposit.brCode ?? "")}
                    >
                      <Copy className="size-4" />
                      Copiar codigo Pix
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="order-1 flex items-center justify-center rounded-[20px] border border-dashed border-border bg-card/80 p-4 md:order-2">
                {latestDeposit.qrCodeImage && latestDeposit.status === "PENDING" ? (
                  <img
                    src={latestDeposit.qrCodeImage}
                    alt="QR Code do deposito"
                    className="h-52 w-52 max-w-full rounded-xl object-contain sm:h-56 sm:w-56"
                  />
                ) : latestDeposit.status === "CANCELED" ? (
                  <p className="text-center text-sm text-muted-foreground">
                    Este deposito foi cancelado. Gere um novo Pix para continuar.
                  </p>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    QR Code indisponivel para este deposito.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[20px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum deposito gerado ainda.
            </div>
          )}
        </article>
      </section>

      <section className="rounded-[24px] border border-border/70 bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Historico recente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {depositsTotalCount} deposito(s) registrado(s) na sua conta.
            </p>
          </div>
        </div>

        {deposits.length > 0 ? (
          <ul className="mt-5 space-y-3 sm:mt-6">
            {deposits.map((deposit) => (
              <li
                key={deposit.id}
                className="rounded-[20px] border border-border/70 bg-background/80 px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {formatBalance(deposit.requestedAmount)}
                      </p>
                      <Badge variant="outline">{getDepositStatusLabel(deposit.status)}</Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      CorrelationID: {deposit.correlationID}
                    </p>
                    {deposit.expiresDate ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Vencimento: {formatDateTime(deposit.expiresDate)}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground sm:text-right">
                    {formatDateTime(deposit.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-[20px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Ainda nao existem depositos para exibir.
          </p>
        )}
      </section>
    </div>
  );
}
