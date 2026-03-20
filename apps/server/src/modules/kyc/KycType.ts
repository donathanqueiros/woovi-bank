import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

export const KycStatusEnum = new GraphQLEnumType({
  name: "KycStatus",
  values: {
    PENDING_SUBMISSION: { value: "PENDING_SUBMISSION" },
    UNDER_REVIEW: { value: "UNDER_REVIEW" },
    APPROVED: { value: "APPROVED" },
    REJECTED: { value: "REJECTED" },
  },
});

export const KycIdTypeEnum = new GraphQLEnumType({
  name: "KycIdType",
  values: {
    PASSPORT: { value: "PASSPORT" },
    DRIVERS_LICENSE: { value: "DRIVERS_LICENSE" },
    RG: { value: "RG" },
  },
});

const KycPersonalInfoType = new GraphQLObjectType({
  name: "KycPersonalInfo",
  fields: {
    fullName: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    dateOfBirth: { type: GraphQLString },
    country: { type: GraphQLString },
  },
});

const KycAddressType = new GraphQLObjectType({
  name: "KycAddress",
  fields: {
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    state: { type: GraphQLString },
    postalCode: { type: GraphQLString },
  },
});

const KycIdentityType = new GraphQLObjectType({
  name: "KycIdentity",
  fields: {
    idType: { type: KycIdTypeEnum },
    idNumber: { type: GraphQLString },
  },
});

export const KycType = new GraphQLObjectType({
  name: "Kyc",
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    status: { type: new GraphQLNonNull(KycStatusEnum) },
    personalInfo: { type: KycPersonalInfoType },
    address: { type: KycAddressType },
    identity: { type: KycIdentityType },
    submittedAt: { type: GraphQLString },
    reviewNotes: { type: GraphQLString },
  },
});
