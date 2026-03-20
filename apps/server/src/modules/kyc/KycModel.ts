import { model, Schema, Types } from "mongoose";

export type KycStatus =
  | "PENDING_SUBMISSION"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type KycIdType = "PASSPORT" | "DRIVERS_LICENSE" | "RG";

export type IKyc = {
  userId: Types.ObjectId;
  status: KycStatus;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    country: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    proofDocumentBase64?: string;
    proofDocumentMimeType?: string;
  };
  identity: {
    idType: KycIdType;
    idNumber: string;
    frontImageBase64: string;
    backImageBase64?: string;
  };
  selfie: {
    imageBase64: string;
  };
  submittedAt?: Date;
  reviewNotes?: string;
};

const kycSchema = new Schema<IKyc>({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ["PENDING_SUBMISSION", "UNDER_REVIEW", "APPROVED", "REJECTED"],
    default: "PENDING_SUBMISSION",
  },
  personalInfo: {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    dateOfBirth: { type: String },
    country: { type: String },
  },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    proofDocumentBase64: { type: String },
    proofDocumentMimeType: { type: String },
  },
  identity: {
    idType: { type: String, enum: ["PASSPORT", "DRIVERS_LICENSE", "RG"] },
    idNumber: { type: String },
    frontImageBase64: { type: String },
    backImageBase64: { type: String },
  },
  selfie: {
    imageBase64: { type: String },
  },
  submittedAt: { type: Date },
  reviewNotes: { type: String },
});

export const Kyc = model("Kyc", kycSchema);
