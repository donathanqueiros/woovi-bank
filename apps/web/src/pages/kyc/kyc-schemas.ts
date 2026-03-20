import { z } from "zod";

// ─── Helpers ────────────────────────────────────────────────────────────────

function isAdult(dateStr: string): boolean {
  const dob = new Date(dateStr);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  return age > 18 || (age === 18 && hasBirthdayPassed);
}

/** Validates Brazilian CPF using Mod 11 algorithm */
function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calcDigit = (slice: string) => {
    const sum = slice
      .split("")
      .reduce((acc, d, i) => acc + parseInt(d) * (slice.length + 1 - i), 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const d1 = calcDigit(digits.slice(0, 9));
  const d2 = calcDigit(digits.slice(0, 10));
  return parseInt(digits[9]) === d1 && parseInt(digits[10]) === d2;
}

/** Phone: E.164 format  e.g. +5511999999999  */
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const fileSchema = z.custom<File>((value) => value instanceof File);
const optionalFileSchema = fileSchema.optional();

// ─── Step 1: Personal Info ──────────────────────────────────────────────────

export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(1, "kyc.validation.required")
    .min(3, "Nome deve ter ao menos 3 caracteres"),
  email: z.email("kyc.validation.emailInvalid"),
  phone: z
    .string()
    .min(1, "kyc.validation.required")
    .regex(PHONE_REGEX, "kyc.validation.phoneInvalid"),
  dateOfBirth: z
    .string()
    .min(1, "kyc.validation.required")
    .refine(
      (v) => !isNaN(new Date(v).getTime()),
      "kyc.validation.dateOfBirthInvalid",
    )
    .refine(isAdult, "kyc.validation.dateOfBirthMinAge"),
  country: z.string().min(1, "kyc.validation.required"),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

// ─── Step 2: Address ─────────────────────────────────────────────────────────

export const addressSchema = z.object({
  street: z.string().min(1, "kyc.validation.required"),
  city: z.string().min(1, "kyc.validation.required"),
  state: z.string().min(1, "kyc.validation.required"),
  postalCode: z.string().min(1, "kyc.validation.required"),
  proofDocumentFile: optionalFileSchema,
});

export type AddressFormData = z.infer<typeof addressSchema>;

// ─── Step 3: Identity ─────────────────────────────────────────────────────────

const idTypeEnum = z.enum(["PASSPORT", "DRIVERS_LICENSE", "RG"]);

export const identitySchema = z
  .object({
    idType: idTypeEnum.refine((v) => Boolean(v), "kyc.validation.required"),
    idNumber: z.string().min(1, "kyc.validation.required"),
    frontImageFile: optionalFileSchema,
    backImageFile: optionalFileSchema,
  })
  .superRefine((data, ctx) => {
    // CPF validation for RG (Brazilian ID) and Driver's License
    if (data.idType === "RG" || data.idType === "DRIVERS_LICENSE") {
      if (!isValidCpf(data.idNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "kyc.validation.cpfInvalid",
          path: ["idNumber"],
        });
      }
    }
  });

export type IdentityFormData = z.infer<typeof identitySchema>;

// ─── Step 4: Selfie ──────────────────────────────────────────────────────────

export const selfieSchema = z.object({
  selfieBase64: z.string().min(1, "kyc.validation.selfieRequired"),
});

export type SelfieFormData = z.infer<typeof selfieSchema>;

// ─── Step 5: Review ─────────────────────────────────────────────────────────

export const reviewSchema = z.object({
  termsAccepted: z.literal(true, {
    error: "kyc.review.termsRequired",
  }),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// ─── Combined ────────────────────────────────────────────────────────────────

export const kycSchema = z.object({
  ...personalInfoSchema.shape,
  ...addressSchema.shape,
  ...identitySchema.shape,
  ...selfieSchema.shape,
  ...reviewSchema.shape,
});

export type KycFormData = z.infer<typeof kycSchema>;
