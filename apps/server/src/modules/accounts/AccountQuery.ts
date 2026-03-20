import { GraphQLID, GraphQLInt, GraphQLList, GraphQLNonNull } from "graphql";
import { AccountType } from "./AccountType";
import { Account } from "./AccountModel";
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

/**
 * Accounts module — Public queries (no authentication required)
 * Pattern: account, accounts, accountsCount
 */
export const accountsQueries = {
  account: {
    type: AccountType,
    args: {
      id: { type: new GraphQLNonNull(GraphQLID) },
    },
    resolve: async (_source: unknown, { id }: { id: string }) => {
      return await Account.findById(id);
    },
  },

  accounts: {
    type: new GraphQLNonNull(
      new GraphQLList(new GraphQLNonNull(AccountType)),
    ),
    args: {
      page: { type: GraphQLInt },
      limit: { type: GraphQLInt },
    },
    resolve: async (
      _source: unknown,
      args: { page?: number; limit?: number },
    ) => {
      const { limit, skip } = getPagination(args.page, args.limit);

      return await Account.find({ active: true }, null, {
        sort: { createdAt: -1 },
        skip,
        limit,
      });
    },
  },

  accountsCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: async () => {
      return await Account.countDocuments({ active: true });
    },
  },
};
