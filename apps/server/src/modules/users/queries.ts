import { GraphQLList, GraphQLNonNull } from "graphql";
import { UserType } from "./UserType";
import { User } from "./UserModel";
import { requireAdmin } from "../auth/authorization";
import type { GraphQLContext } from "../../types/auth";

/**
 * Users module — Admin only query
 * Pattern: users
 */
export const usersQueries = {
  users: {
    type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
    resolve: async (
      _source: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      requireAdmin(context);

      return await User.find({}, null, {
        sort: { email: 1 },
      });
    },
  },
};
