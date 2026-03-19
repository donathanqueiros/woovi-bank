import {
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLString,
} from "graphql";

export const DepositRequestStatusType = new GraphQLEnumType({
  name: "DepositRequestStatus",
  values: {
    PENDING: { value: "PENDING" },
    COMPLETED: { value: "COMPLETED" },
    EXPIRED: { value: "EXPIRED" },
  },
});

export const DepositRequestType = new GraphQLObjectType({
  name: "DepositRequest",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    accountId: {
      type: new GraphQLNonNull(GraphQLID),
      resolve: (deposit) => String(deposit.accountId),
    },
    correlationID: { type: new GraphQLNonNull(GraphQLString) },
    requestedAmount: { type: new GraphQLNonNull(GraphQLFloat) },
    paidAmount: { type: GraphQLFloat },
    status: { type: new GraphQLNonNull(DepositRequestStatusType) },
    brCode: {
      type: GraphQLString,
      resolve: (deposit) => deposit.wooviChargeData?.brCode ?? null,
    },
    qrCodeImage: {
      type: GraphQLString,
      resolve: (deposit) => deposit.wooviChargeData?.qrCodeImage ?? null,
    },
    expiresDate: {
      type: GraphQLString,
      resolve: (deposit) => deposit.wooviChargeData?.expiresDate ?? null,
    },
    comment: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    completedAt: { type: GraphQLString },
    expiredAt: { type: GraphQLString },
  },
});