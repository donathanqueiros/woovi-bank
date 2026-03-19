import { GraphQLFloat, GraphQLNonNull, GraphQLString } from "graphql";
import { TransactionType } from "../TransactionType";
import { Account } from "../../accounts/AccountModel";
import { runWithOptionalTransaction } from "../../../database/runWithOptionalTransaction";
import { Transaction } from "../TransactionModel";
import { IdempotencyRequest } from "../../idempotency/IdempotencyRequestModel";
import { LedgerEntry } from "../../ledger/LedgerEntryModel";
import { getAccountBalance } from "../../ledger/balance";
import { transferNotificationBus } from "../../notifications/transferNotificationBus";
import type { GraphQLContext } from "../../../types/auth";

export const TransferMutation = {
  type: new GraphQLNonNull(TransactionType),
  args: {
    fromAccountId: { type: new GraphQLNonNull(GraphQLString) },
    toAccountId: { type: new GraphQLNonNull(GraphQLString) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    idempotencyKey: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
  },
  resolve: async (
    _source: unknown,
    {
      fromAccountId,
      toAccountId,
      amount,
      idempotencyKey,
      description,
    }: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      idempotencyKey: string;
      description?: string;
    },
    context: GraphQLContext,
  ) => {
    if (amount <= 0) throw new Error("Valor deve ser maior que zero");
    if (fromAccountId === toAccountId) {
      throw new Error("Nao e permitido transferir para a mesma conta");
    }
    if (!idempotencyKey.trim()) {
      throw new Error("idempotencyKey obrigatoria");
    }

    if (!context.auth) {
      throw new Error("Usuario nao autenticado");
    }

    const existingRequest = await IdempotencyRequest.findOne({
      accountId: fromAccountId,
      idempotencyKey,
    });

    if (existingRequest) {
      const existingTransaction = await Transaction.findById(
        existingRequest.transferId,
      );

      if (!existingTransaction) {
        throw new Error("Transferencia idempotente nao encontrada");
      }

      return existingTransaction;
    }

    const fromAccount = await Account.findById(fromAccountId);
    const toAccount = await Account.findById(toAccountId);

    if (!fromAccount || !toAccount)
      throw new Error("Uma ou ambas as contas não existem");

    if (context.auth.role !== "ADMIN" && String(fromAccount.userId) !== context.auth.userId) {
      throw new Error("Sem permissao para transferir desta conta");
    }

    if (!fromAccount.active || !toAccount.active) {
      throw new Error("Transferencia permitida apenas entre contas ativas");
    }

    const currentBalance = await getAccountBalance(fromAccountId);

    if (currentBalance < amount) throw new Error("Saldo insuficiente");

    let transaction: InstanceType<typeof Transaction> | null = null;

    await runWithOptionalTransaction(async (dbSession) => {
      const sessionOptions = dbSession ? { session: dbSession } : null;

        transaction = new Transaction({
          fromAccountId,
          toAccountId,
          amount,
          idempotencyKey,
          description,
        });
        if (sessionOptions) {
          await transaction.save(sessionOptions);
        } else {
          await transaction.save();
        }

      const ledgerEntries = [
        {
          accountId: fromAccountId,
          transferId: transaction.id,
          amount: -amount,
          type: "DEBIT",
        },
        {
          accountId: toAccountId,
          transferId: transaction.id,
          amount,
          type: "CREDIT",
        },
      ];

      if (sessionOptions) {
        await LedgerEntry.insertMany(ledgerEntries, sessionOptions);
      } else {
        await LedgerEntry.insertMany(ledgerEntries);
      }

        const idempotencyRequest = new IdempotencyRequest({
          accountId: fromAccountId,
          idempotencyKey,
          transferId: transaction.id,
        });
        if (sessionOptions) {
          await idempotencyRequest.save(sessionOptions);
        } else {
          await idempotencyRequest.save();
        }
      });

    if (!transaction) {
      throw new Error("Falha ao criar transferencia");
    }

    const persistedTransaction = transaction as {
      id: string;
      createdAt: Date | string;
    };

    transferNotificationBus.publishTransferReceived({
      transactionId: String(persistedTransaction.id),
      fromAccountId,
      toAccountId,
      amount,
      ...(description ? { description } : {}),
      createdAt: new Date(persistedTransaction.createdAt).toISOString(),
    });

    return transaction;
  },
};
