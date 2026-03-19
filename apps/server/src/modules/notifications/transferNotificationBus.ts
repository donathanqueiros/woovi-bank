import { EventEmitter, on } from "node:events";

export type TransferReceivedNotification = {
  transactionId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  createdAt: string;
};

const TRANSFER_RECEIVED_EVENT = "transfer-received";

class TransferNotificationBus {
  private readonly emitter = new EventEmitter();

  publishTransferReceived(payload: TransferReceivedNotification) {
    this.emitter.emit(TRANSFER_RECEIVED_EVENT, payload);
  }

  async *subscribeTransferReceived(): AsyncIterable<TransferReceivedNotification> {
    for await (const [payload] of on(this.emitter, TRANSFER_RECEIVED_EVENT)) {
      yield payload as TransferReceivedNotification;
    }
  }
}

export const transferNotificationBus = new TransferNotificationBus();