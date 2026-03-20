import { KycType } from "./KycType";
import { Kyc } from "./KycModel";
import type { GraphQLContext } from "../../types/auth";

/**
 * KYC module — Owner only query
 * Pattern: myKyc
 */
export const kycQueries = {
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
};
