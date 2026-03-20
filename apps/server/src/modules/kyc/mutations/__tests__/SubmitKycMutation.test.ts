jest.mock("../../KycModel", () => {
  const Kyc = {
    findOneAndUpdate: jest.fn(),
  };

  return { Kyc };
});

import { executeGraphQL } from "../../../../__tests__/helpers/executeGraphQL";
import { Kyc } from "../../KycModel";

const KycModel = Kyc as unknown as {
  findOneAndUpdate: jest.Mock;
};

const SUBMIT_KYC_MUTATION = `
  mutation {
    SubmitKyc(
      fullName: "Maria Silva"
      email: "maria@example.com"
      phone: "+5511999999999"
      dateOfBirth: "1990-01-15"
      country: "BR"
      street: "Rua das Flores, 123"
      city: "Sao Paulo"
      state: "SP"
      postalCode: "01310-100"
      idType: "RG"
      idNumber: "12345678"
      frontImageBase64: "data:image/jpeg;base64,abc"
      selfieBase64: "data:image/jpeg;base64,def"
    ) {
      id
      status
      personalInfo {
        fullName
        email
      }
      address {
        street
        city
      }
      identity {
        idType
        idNumber
      }
    }
  }
`;

function makeKycDoc(overrides: object = {}) {
  return {
    id: "kyc-1",
    status: "APPROVED",
    submittedAt: new Date("2026-01-01T00:00:00.000Z"),
    personalInfo: {
      fullName: "Maria Silva",
      email: "maria@example.com",
      phone: "+5511999999999",
      dateOfBirth: "1990-01-15",
      country: "BR",
    },
    address: {
      street: "Rua das Flores, 123",
      city: "Sao Paulo",
      state: "SP",
      postalCode: "01310-100",
    },
    identity: {
      idType: "RG",
      idNumber: "12345678",
    },
    selfie: { imageBase64: "data:image/jpeg;base64,def" },
    ...overrides,
  };
}

describe("SubmitKyc mutation", () => {
  it("envia KYC com sucesso quando autenticado", async () => {
    KycModel.findOneAndUpdate.mockResolvedValue(makeKycDoc());

    const result = await executeGraphQL(SUBMIT_KYC_MUTATION, {
      auth: { userId: "user-1", role: "USER" },
    });

    expect(result.errors).toBeUndefined();
    expect(KycModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user-1" },
      expect.objectContaining({
        status: "APPROVED",
        personalInfo: expect.objectContaining({ fullName: "Maria Silva" }),
        address: expect.objectContaining({ city: "Sao Paulo" }),
        identity: expect.objectContaining({ idType: "RG", idNumber: "12345678" }),
        selfie: { imageBase64: "data:image/jpeg;base64,def" },
      }),
      { upsert: true, new: true },
    );
    expect(result.data).toEqual({
      SubmitKyc: {
        id: "kyc-1",
        status: "APPROVED",
        personalInfo: { fullName: "Maria Silva", email: "maria@example.com" },
        address: { street: "Rua das Flores, 123", city: "Sao Paulo" },
        identity: { idType: "RG", idNumber: "12345678" },
      },
    });
  });

  it("retorna erro quando nao autenticado", async () => {
    const result = await executeGraphQL(SUBMIT_KYC_MUTATION);

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/autenticac/i);
    expect(KycModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("atualiza KYC existente via upsert quando ja submetido anteriormente", async () => {
    KycModel.findOneAndUpdate.mockResolvedValue(
      makeKycDoc({ submittedAt: new Date("2026-03-01T00:00:00.000Z") }),
    );

    const result = await executeGraphQL(SUBMIT_KYC_MUTATION, {
      auth: { userId: "user-1", role: "USER" },
    });

    expect(result.errors).toBeUndefined();
    expect(KycModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(result.data?.SubmitKyc).toMatchObject({ status: "APPROVED" });
  });

  it("define submittedAt no momento do envio", async () => {
    KycModel.findOneAndUpdate.mockResolvedValue(makeKycDoc());

    await executeGraphQL(SUBMIT_KYC_MUTATION, {
      auth: { userId: "user-1", role: "USER" },
    });

    const callArgs = KycModel.findOneAndUpdate.mock.calls[0][1] as {
      submittedAt: unknown;
    };
    expect(callArgs.submittedAt).toBeInstanceOf(Date);
  });
});
