import { GraphQLObjectType } from "graphql";
import { accountMutations } from "../modules/accounts/mutations/accountMutationts";
import { depositMutations } from "../modules/deposits/mutations/depositMutations";
import { transactionMutations } from "../modules/transactions/mutations/transactionMutations";
import { userMutations } from "../modules/users/mutations/userMutations";

export const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    ...accountMutations,
    ...depositMutations,
    ...transactionMutations,
    ...userMutations,
  }),
});
