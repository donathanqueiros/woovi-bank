import { model, Schema } from "mongoose";

export type IAccount = {
  holderName: string;
  balance: number;
  createdAt: Date;
};

const accountSchema = new Schema<IAccount>({
  holderName: { type: String, required: true },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Account = model("Account", accountSchema);
