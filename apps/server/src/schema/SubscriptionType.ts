import {
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { Account } from "../modules/accounts/AccountModel";
import { transferNotificationBus } from "../modules/notifications/transferNotificationBus";
import type { GraphQLContext } from "../types/auth";

const TransferReceivedType = new GraphQLObjectType({
  name: "TransferReceived",
  fields: {
    transactionId: { type: new GraphQLNonNull(GraphQLID) },
    fromAccountId: { type: new GraphQLNonNull(GraphQLID) },
    toAccountId: { type: new GraphQLNonNull(GraphQLID) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    description: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  },
});

export const SubscriptionType = new GraphQLObjectType({
  name: "Subscription",
  fields: {
    transferReceived: {
      type: new GraphQLNonNull(TransferReceivedType),
      args: {
        accountId: { type: new GraphQLNonNull(GraphQLID) },
      },
      subscribe: async function* (
        _source: unknown,
        args: { accountId: string },
        context: GraphQLContext,
      ) {
        if (!context.auth) {
          throw new Error("Usuario nao autenticado");
        }

        if (context.auth.role !== "ADMIN") {
          const account = await Account.findById(args.accountId);

          if (!account || String(account.userId) !== context.auth.userId) {
            throw new Error("Sem permissao para assinar notificacoes desta conta");
          }
        }

        for await (const notification of transferNotificationBus.subscribeTransferReceived()) {
          if (notification.toAccountId !== args.accountId) {
            continue;
          }

          yield notification;
        }
      },
      resolve: (payload) => payload,
    },
  },
});