import { model, Schema, Types } from "mongoose";

export type IAccount = {
  userId?: Types.ObjectId | string | null;
  holderName: string;
  balance: number;
  active: boolean;
  deletedAt?: Date;
  deletedByUserId?: Types.ObjectId | string;
  createdAt: Date;
};

const accountSchema = new Schema<IAccount>({
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  holderName: { type: String, required: true },
  balance: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  deletedAt: { type: Date },
  deletedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export const Account = model("Account", accountSchema);
