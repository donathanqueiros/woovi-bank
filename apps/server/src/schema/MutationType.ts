import { GraphQLObjectType } from "graphql";
import { accountMutations } from "../modules/accounts/mutations/accountMutationts";

export const MutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    ...accountMutations,
  }),
});
