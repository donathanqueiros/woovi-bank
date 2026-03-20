import {
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import type { GraphQLContext } from "../../types/auth";
import { AccountType } from "../accounts/AccountType";
import { Account } from "../accounts/AccountModel";

export const TransactionType = new GraphQLObjectType({
  name: "Transaction",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    fromAccount: {
      type: new GraphQLNonNull(AccountType),
      resolve: async (transaction, _args, context: GraphQLContext) => {
        const account = await Account.findById(transaction.fromAccountId);
        if (!account) return null;

        if (
          context.auth?.role !== "ADMIN" &&
          String(account.userId) !== context.auth?.userId
        ) {
          return null;
        }

        return account;
      },
    },
    toAccount: {
      type: new GraphQLNonNull(AccountType),
      resolve: async (transaction, _args, context: GraphQLContext) => {
        const account = await Account.findById(transaction.toAccountId);
        if (!account) return null;

        if (
          context.auth?.role !== "ADMIN" &&
          String(account.userId) !== context.auth?.userId
        ) {
          return null;
        }

        return account;
      },
    },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  }),
});
