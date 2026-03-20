import { GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull } from "graphql";
import { TransactionType } from "./TransactionType";
import { Transaction } from "./TransactionModel";
import { Account } from "../accounts/AccountModel";
import {
  requireAuth,
  getAuthenticatedAccount,
  assertAccountOwnerOrAdmin,
} from "../auth/authorization";
import type { GraphQLContext } from "../../types/auth";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function getPagination(page?: number | null, limit?: number | null) {
  const safePage =
    typeof page === "number" && page > 0 ? Math.floor(page) : DEFAULT_PAGE;
  const safeLimit =
    typeof limit === "number" && limit > 0
      ? Math.min(Math.floor(limit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

function buildTransactionsQuery(accountId?: string) {
  if (!accountId) {
    return {};
  }

  return {
    $or: [{ fromAccountId: accountId }, { toAccountId: accountId }],
  };
}

function transactionBelongsToAccount(
  transaction: { fromAccountId: unknown; toAccountId: unknown },
  accountId: string,
) {
  return (
    String(transaction.fromAccountId) === accountId ||
    String(transaction.toAccountId) === accountId
  );
}

/**
 * Transactions module — Owner or Admin queries
 * Pattern: transaction, transactions, transactionsCount
 */
export const transactionsQueries = {
  transaction: {
    type: TransactionType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLID) },
    },
    resolve: async (
      _source: unknown,
      { id }: { id: string },
      context: GraphQLContext,
    ) => {
      requireAuth(context);
      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return null;
      }

      // Admin can access any transaction; users can only access their own
      const account = await getAuthenticatedAccount(context);
      if (!transactionBelongsToAccount(transaction, String(account.id))) {
        throw new Error("Sem permissao para acessar esta transacao");
      }

      return transaction;
    },
  },

  transactions: {
    type: new GraphQLNonNull(
      new GraphQLList(new GraphQLNonNull(TransactionType)),
    ),
    args: {
      page: { type: GraphQLInt },
      limit: { type: GraphQLInt },
      accountId: { type: GraphQLID },
    },
    resolve: async (
      _source: unknown,
      args: { page?: number; limit?: number; accountId?: string },
      context: GraphQLContext,
    ) => {
      const { limit, skip } = getPagination(args.page, args.limit);
      const accountId = await assertAccountOwnerOrAdmin(
        args.accountId,
        context,
      );
      const query = buildTransactionsQuery(accountId);

      return await Transaction.find(query, null, {
        sort: { createdAt: -1 },
        skip,
        limit,
      });
    },
  },

  transactionsCount: {
    type: new GraphQLNonNull(GraphQLInt),
    args: {
      accountId: { type: GraphQLID },
    },
    resolve: async (
      _source: unknown,
      args: { accountId?: string },
      context: GraphQLContext,
    ) => {
      const accountId = await assertAccountOwnerOrAdmin(
        args.accountId,
        context,
      );
      const query = buildTransactionsQuery(accountId);

      return await Transaction.countDocuments(query);
    },
  },
};
