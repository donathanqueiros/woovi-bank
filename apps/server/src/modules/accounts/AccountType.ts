import {
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

export const AccountType = new GraphQLObjectType({
  name: "Account",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    holderName: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  },
});
