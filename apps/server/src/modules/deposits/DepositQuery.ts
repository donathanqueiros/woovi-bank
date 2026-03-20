import { GraphQLInt, GraphQLList, GraphQLNonNull } from "graphql";
import {
  DepositRequestStatusType,
  DepositRequestType,
} from "./DepositRequestType";
import { DepositRequest } from "./DepositRequestModel";
import { getAuthenticatedAccount } from "../auth/authorization";
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
 * Deposits module — Owner only queries
 * Pattern: myDeposits, myDepositsCount
 */
export const depositsQueries = {
  myDeposits: {
    type: new GraphQLNonNull(
      new GraphQLList(new GraphQLNonNull(DepositRequestType)),
    ),
    args: {
      page: { type: GraphQLInt },
      limit: { type: GraphQLInt },
      status: { type: DepositRequestStatusType },
    },
    resolve: async (
      _source: unknown,
      args: {
        page?: number;
        limit?: number;
        status?: "PENDING" | "COMPLETED" | "EXPIRED";
      },
      context: GraphQLContext,
    ) => {
      const account = await getAuthenticatedAccount(context);

      const { limit, skip } = getPagination(args.page, args.limit);

      return await DepositRequest.find(
        {
          accountId: account.id,
          ...(args.status ? { status: args.status } : {}),
        },
        null,
        {
          sort: { createdAt: -1 },
          skip,
          limit,
        },
      );
    },
  },

  myDepositsCount: {
    type: new GraphQLNonNull(GraphQLInt),
    args: {
      status: { type: DepositRequestStatusType },
    },
    resolve: async (
      _source: unknown,
      args: { status?: "PENDING" | "COMPLETED" | "EXPIRED" },
      context: GraphQLContext,
    ) => {
      const account = await getAuthenticatedAccount(context);

      return await DepositRequest.countDocuments({
        accountId: account.id,
        ...(args.status ? { status: args.status } : {}),
      });
    },
  },
};
