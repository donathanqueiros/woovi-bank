import {
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
} from "graphql";
import { AccountType } from "../modules/accounts/AccountType";
import { Account } from "../modules/accounts/AccountModel";

export const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
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
      resolve: async () => {
        return await Account.find();
      },
    },
  },
});
