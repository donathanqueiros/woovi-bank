import { DepositConfirmedSubscription } from "./DepositConfirmedSubscription";
import { TransferReceivedSubscription } from "./TransferReceivedSubscription";

export const notificationSubscriptions = {
  depositConfirmed: DepositConfirmedSubscription,
  transferReceived: TransferReceivedSubscription,
};
