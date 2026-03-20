import { useEffect } from "react";
import { graphql, requestSubscription, useRelayEnvironment } from "react-relay";
import { toast } from "sonner";
import { formatBalance, formatDateTime } from "@/lib/formatters";
import {
  dispatchAccountDepositConfirmed,
  dispatchAccountTransferReceived,
} from "@/lib/account-notification-events";
import { useAuth } from "@/lib/use-auth";
import type { accountNotificationsDepositConfirmedSubscription } from "./__generated__/accountNotificationsDepositConfirmedSubscription.graphql";
import type { accountNotificationsTransferReceivedSubscription } from "./__generated__/accountNotificationsTransferReceivedSubscription.graphql";

const transferReceivedSubscriptionNode = graphql`
  subscription accountNotificationsTransferReceivedSubscription($accountId: ID!) {
    transferReceived(accountId: $accountId) {
      transactionId
      fromAccountId
      fromAccountHolderName
      toAccountId
      amount
      description
      createdAt
    }
  }
`;

const depositConfirmedSubscriptionNode = graphql`
  subscription accountNotificationsDepositConfirmedSubscription($accountId: ID!) {
    depositConfirmed(accountId: $accountId) {
      depositId
      accountId
      correlationID
      amount
      createdAt
      completedAt
    }
  }
`;

export function AccountNotifications() {
  const relayEnvironment = useRelayEnvironment();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.accountId) {
      return;
    }

    const subscription = requestSubscription<accountNotificationsTransferReceivedSubscription>(
      relayEnvironment,
      {
        subscription: transferReceivedSubscriptionNode,
        variables: { accountId: user.accountId },
        onNext: (data) => {
          const payload = data?.transferReceived;

          if (!payload) {
            return;
          }

          toast.success(
            `Voce recebeu ${formatBalance(payload.amount)} de ${payload.fromAccountHolderName}`,
            {
              description: payload.description
                ? payload.description
                : `Transferencia em ${formatDateTime(payload.createdAt)}`,
            },
          );

          dispatchAccountTransferReceived(payload);
        },
      },
    );

    return () => subscription.dispose();
  }, [relayEnvironment, user?.accountId]);

  useEffect(() => {
    if (!user?.accountId) {
      return;
    }

    const subscription = requestSubscription<accountNotificationsDepositConfirmedSubscription>(
      relayEnvironment,
      {
        subscription: depositConfirmedSubscriptionNode,
        variables: { accountId: user.accountId },
        onNext: (data) => {
          const payload = data?.depositConfirmed;

          if (!payload) {
            return;
          }

          toast.success(`Deposito confirmado: ${formatBalance(payload.amount)}`, {
            description: `Confirmado em ${formatDateTime(payload.completedAt)}`,
          });

          dispatchAccountDepositConfirmed(payload);
        },
      },
    );

    return () => subscription.dispose();
  }, [relayEnvironment, user?.accountId]);

  return null;
}
