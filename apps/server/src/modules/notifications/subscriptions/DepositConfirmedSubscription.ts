import {
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { Account } from "../../accounts/AccountModel";
import { depositNotificationBus } from "../depositNotificationBus";
import type { GraphQLContext } from "../../../types/auth";

const DepositConfirmedType = new GraphQLObjectType({
  name: "DepositConfirmed",
  fields: {
    depositId: { type: new GraphQLNonNull(GraphQLID) },
    accountId: { type: new GraphQLNonNull(GraphQLID) },
    correlationID: { type: new GraphQLNonNull(GraphQLString) },
    amount: { type: new GraphQLNonNull(GraphQLFloat) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    completedAt: { type: new GraphQLNonNull(GraphQLString) },
  },
});

export const DepositConfirmedSubscription = {
  type: new GraphQLNonNull(DepositConfirmedType),
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

    for await (const notification of depositNotificationBus.subscribeDepositConfirmed()) {
      if (notification.accountId !== args.accountId) {
        continue;
      }

      yield notification;
    }
  },
  resolve: (payload: unknown) => payload,
};