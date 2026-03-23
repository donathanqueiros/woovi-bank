import { model, Schema, Types } from "mongoose";

export type DepositRequestStatus =
  | "PENDING"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELED";

export type WooviChargeData = {
  brCode?: string;
  qrCodeImage?: string;
  expiresDate?: string;
};

export type IDepositRequest = {
  accountId: Types.ObjectId;
  correlationID: string;
  requestedAmount: number;
  paidAmount?: number;
  status: DepositRequestStatus;
  wooviChargeData: WooviChargeData;
  comment?: string;
  completedAt?: Date;
  expiredAt?: Date;
  createdAt: Date;
};

const depositRequestSchema = new Schema<IDepositRequest>({
  accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true, index: true },
  correlationID: { type: String, required: true, unique: true },
  requestedAmount: { type: Number, required: true },
  paidAmount: { type: Number },
  status: {
    type: String,
    enum: ["PENDING", "COMPLETED", "EXPIRED", "CANCELED"],
    required: true,
    default: "PENDING",
    index: true,
  },
  wooviChargeData: {
    brCode: { type: String },
    qrCodeImage: { type: String },
    expiresDate: { type: String },
  },
  comment: { type: String },
  completedAt: { type: Date },
  expiredAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
});

depositRequestSchema.index({ accountId: 1, createdAt: -1 });

export const DepositRequest = model("DepositRequest", depositRequestSchema);
