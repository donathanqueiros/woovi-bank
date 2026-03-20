import { GraphQLNonNull, GraphQLString } from "graphql";
import type { GraphQLContext } from "../../../types/auth";
import { Kyc } from "../KycModel";
import { KycType } from "../KycType";

export const SubmitKycMutation = {
  type: new GraphQLNonNull(KycType),
  args: {
    // Step 1 – Personal Info
    fullName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    phone: { type: new GraphQLNonNull(GraphQLString) },
    dateOfBirth: { type: new GraphQLNonNull(GraphQLString) },
    country: { type: new GraphQLNonNull(GraphQLString) },
    // Step 2 – Address
    street: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
    state: { type: new GraphQLNonNull(GraphQLString) },
    postalCode: { type: new GraphQLNonNull(GraphQLString) },
    proofDocumentBase64: { type: GraphQLString },
    proofDocumentMimeType: { type: GraphQLString },
    // Step 3 – Identity
    idType: { type: new GraphQLNonNull(GraphQLString) },
    idNumber: { type: new GraphQLNonNull(GraphQLString) },
    frontImageBase64: { type: new GraphQLNonNull(GraphQLString) },
    backImageBase64: { type: GraphQLString },
    // Step 4 – Selfie
    selfieBase64: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _source: unknown,
    args: {
      fullName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      country: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      proofDocumentBase64?: string;
      proofDocumentMimeType?: string;
      idType: string;
      idNumber: string;
      frontImageBase64: string;
      backImageBase64?: string;
      selfieBase64: string;
    },
    context: GraphQLContext,
  ) => {
    if (!context.auth?.userId) {
      throw new Error("Autenticacao necessaria");
    }

    const kyc = await Kyc.findOneAndUpdate(
      { userId: context.auth.userId },
      {
        userId: context.auth.userId,
        status: "APPROVED",
        submittedAt: new Date(),
        personalInfo: {
          fullName: args.fullName,
          email: args.email,
          phone: args.phone,
          dateOfBirth: args.dateOfBirth,
          country: args.country,
        },
        address: {
          street: args.street,
          city: args.city,
          state: args.state,
          postalCode: args.postalCode,
          proofDocumentBase64: args.proofDocumentBase64,
          proofDocumentMimeType: args.proofDocumentMimeType,
        },
        identity: {
          idType: args.idType,
          idNumber: args.idNumber,
          frontImageBase64: args.frontImageBase64,
          backImageBase64: args.backImageBase64,
        },
        selfie: {
          imageBase64: args.selfieBase64,
        },
      },
      { upsert: true, new: true },
    );

    return kyc;
  },
};
