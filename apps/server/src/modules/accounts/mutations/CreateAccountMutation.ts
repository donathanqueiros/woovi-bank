import { GraphQLNonNull, GraphQLString } from "graphql";
import { AccountType } from "../AccountType";
import { Account } from "../AccountModel";

export const CreateAccountMutation = {
  type: new GraphQLNonNull(AccountType),
  args: {
    holderName: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (_, { holderName }: { holderName: string }) => {
    const account = new Account({ holderName });
    await account.save();
    return account;
  },
};
