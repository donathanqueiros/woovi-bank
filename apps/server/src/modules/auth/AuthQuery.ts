import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { Account } from "../accounts/AccountModel";
import { Kyc } from "../kyc/KycModel";
import { KycStatusEnum } from "../kyc/KycType";
import { User } from "../users/UserModel";
import type { GraphQLContext } from "../../types/auth";

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

/**
 * Auth queries — Optional authentication
 * Pattern: me
 */
export const authQueries = {
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
};
