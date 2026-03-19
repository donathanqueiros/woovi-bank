import { EventEmitter, on } from "node:events";

export type DepositConfirmedNotification = {
  depositId: string;
  accountId: string;
  correlationID: string;
  amount: number;
  createdAt: string;
  completedAt: string;
};

const DEPOSIT_CONFIRMED_EVENT = "deposit-confirmed";

class DepositNotificationBus {
  private readonly emitter = new EventEmitter();

  publishDepositConfirmed(payload: DepositConfirmedNotification) {
    this.emitter.emit(DEPOSIT_CONFIRMED_EVENT, payload);
  }

  async *subscribeDepositConfirmed(): AsyncIterable<DepositConfirmedNotification> {
    for await (const [payload] of on(this.emitter, DEPOSIT_CONFIRMED_EVENT)) {
      yield payload as DepositConfirmedNotification;
    }
  }
}

export const depositNotificationBus = new DepositNotificationBus();