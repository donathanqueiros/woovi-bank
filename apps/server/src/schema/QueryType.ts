import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { AccountType } from "../modules/accounts/AccountType";
import { Account } from "../modules/accounts/AccountModel";
import {
  DepositRequestStatusType,
  DepositRequestType,
} from "../modules/deposits/DepositRequestType";
import { DepositRequest } from "../modules/deposits/DepositRequestModel";
import { TransactionType } from "../modules/transactions/TransactionType";
import { Transaction } from "../modules/transactions/TransactionModel";
import { User } from "../modules/users/UserModel";
import { UserType } from "../modules/users/UserType";
import { Kyc } from "../modules/kyc/KycModel";
import { KycType, KycStatusEnum } from "../modules/kyc/KycType";
import type { GraphQLContext } from "../types/auth";

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

const UserRoleType = new GraphQLEnumType({
  name: "QueryUserRole",
  values: {
    USER: { value: "USER" },
    ADMIN: { value: "ADMIN" },
  },
});

const MeType = new GraphQLObjectType({
  name: "Me",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    role: { type: new GraphQLNonNull(UserRoleType) },
    active: { type: new GraphQLNonNull(GraphQLBoolean) },
    accountId: {
      type: GraphQLID,
      resolve: async (user) => {
        const account = await Account.findOne({ userId: user.id });
        return account?.id ?? null;
      },
    },
    kycStatus: {
      type: new GraphQLNonNull(KycStatusEnum),
      resolve: async (user) => {
        if (user.role === "ADMIN") return "APPROVED";
        const kyc = await Kyc.findOne({ userId: user.id });
        return kyc?.status ?? "PENDING_SUBMISSION";
      },
    },
  },
});

export const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    me: {
      type: MeType,
      resolve: async (
        _source: unknown,
        _args: unknown,
        context: GraphQLContext,
      ) => {
        if (!context.auth?.userId) {
          return null;
        }

        return await User.findById(context.auth.userId);
      },
    },

    users: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
      resolve: async (
        _source: unknown,
        _args: unknown,
        context: GraphQLContext,
      ) => {
        if (context.auth?.role !== "ADMIN") {
          throw new Error("Acesso restrito a administradores");
        }

        return await User.find({}, null, {
          sort: { email: 1 },
        });
      },
    },

    account: {
      type: AccountType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_, { id }: { id: string }) => {
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
        _source,
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

    transaction: {
      type: TransactionType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_, { id }: { id: string }) => {
        return await Transaction.findById(id);
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
        _source,
        args: { page?: number; limit?: number; accountId?: string },
      ) => {
        const { limit, skip } = getPagination(args.page, args.limit);
        const query = args.accountId
          ? {
              $or: [
                { fromAccountId: args.accountId },
                { toAccountId: args.accountId },
              ],
            }
          : {};

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
      resolve: async (_source, args: { accountId?: string }) => {
        const query = args.accountId
          ? {
              $or: [
                { fromAccountId: args.accountId },
                { toAccountId: args.accountId },
              ],
            }
          : {};

        return await Transaction.countDocuments(query);
      },
    },

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
        args: { page?: number; limit?: number; status?: "PENDING" | "COMPLETED" | "EXPIRED" },
        context: GraphQLContext,
      ) => {
        if (!context.auth) {
          throw new Error("Usuario nao autenticado");
        }

        const account = await Account.findOne({ userId: context.auth.userId });

        if (!account) {
          throw new Error("Conta do usuario nao encontrada");
        }

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
        if (!context.auth) {
          throw new Error("Usuario nao autenticado");
        }

        const account = await Account.findOne({ userId: context.auth.userId });

        if (!account) {
          throw new Error("Conta do usuario nao encontrada");
        }

        return await DepositRequest.countDocuments({
          accountId: account.id,
          ...(args.status ? { status: args.status } : {}),
        });
      },
    },

    myKyc: {
      type: KycType,
      resolve: async (
        _source: unknown,
        _args: unknown,
        context: GraphQLContext,
      ) => {
        if (!context.auth?.userId) return null;
        return await Kyc.findOne({ userId: context.auth.userId });
      },
    },
  },
});
