import {
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { getAccountBalance } from "../ledger/balance";
import type { GraphQLContext } from "../../types/auth";

export const AccountType = new GraphQLObjectType({
  name: "Account",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    holderName: { type: new GraphQLNonNull(GraphQLString) },
    balance: {
      type: GraphQLFloat,
      resolve: async (account, _args, context: GraphQLContext) => {
        if (!context.auth) {
          return null;
        }

        if (
          context.auth.role !== "ADMIN" &&
          String(account.userId) !== context.auth.userId
        ) {
          return null;
        }

        return await getAccountBalance(String(account.id));
      },
    },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  },
});
