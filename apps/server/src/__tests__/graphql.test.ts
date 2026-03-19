import { GraphQLSchema } from 'graphql';
import { graphql } from 'graphql';
import { schema } from '../graphql/schema';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

// Mock dos modelos
jest.mock('../models/Account');
jest.mock('../models/Transaction');

describe('GraphQL Mutations - Transfer', () => {
  const mockAccount1 = {
    id: '1',
    holderName: 'João',
    balance: 1000,
    save: jest.fn(),
  };

  const mockAccount2 = {
    id: '2',
    holderName: 'Maria',
    balance: 500,
    save: jest.fn(),
  };

  const mockTransaction = {
    id: 't1',
    fromAccountId: '1',
    toAccountId: '2',
    amount: 100,
    description: 'Teste',
    createdAt: new Date(),
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar uma conta com sucesso', async () => {
    (Account as jest.Mock).mockImplementation(() => mockAccount1);
    mockAccount1.save.mockResolvedValue(mockAccount1);

    const query = `
      mutation {
        createAccount(holderName: "João Silva") {
          id
          holderName
          balance
        }
      }
    `;

    const result = await graphql({
      schema,
      source: query,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.createAccount.holderName).toBe('João Silva');
  });

  it('deve fazer uma transferência válida', async () => {
    (Account.findById as jest.Mock)
      .mockResolvedValueOnce(mockAccount1)
      .mockResolvedValueOnce(mockAccount2);
    
    (Transaction as jest.Mock).mockImplementation(() => mockTransaction);
    mockTransaction.save.mockResolvedValue(mockTransaction);
    mockAccount1.save.mockResolvedValue(mockAccount1);
    mockAccount2.save.mockResolvedValue(mockAccount2);

    const query = `
      mutation {
        transfer(
          fromAccountId: "1"
          toAccountId: "2"
          amount: 100
          description: "Teste"
        ) {
          id
          amount
          description
        }
      }
    `;

    const result = await graphql({
      schema,
      source: query,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.transfer.amount).toBe(100);
  });

  it('deve lançar erro se saldo insuficiente', async () => {
    const accountComPouco = { ...mockAccount1, balance: 50 };
    
    (Account.findById as jest.Mock)
      .mockResolvedValueOnce(accountComPouco)
      .mockResolvedValueOnce(mockAccount2);

    const query = `
      mutation {
        transfer(
          fromAccountId: "1"
          toAccountId: "2"
          amount: 100
          description: "Teste"
        ) {
          id
        }
      }
    `;

    const result = await graphql({
      schema,
      source: query,
    });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('Saldo insuficiente');
  });
});

describe('GraphQL Queries', () => {
  const mockAccounts = [
    { id: '1', holderName: 'João', balance: 1000, createdAt: new Date() },
    { id: '2', holderName: 'Maria', balance: 500, createdAt: new Date() },
  ];

  it('deve listar todas as contas', async () => {
    (Account.find as jest.Mock).mockResolvedValue(mockAccounts);

    const query = `
      query {
        accounts {
          id
          holderName
          balance
        }
      }
    `;

    const result = await graphql({
      schema,
      source: query,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.accounts).toHaveLength(2);
    expect(result.data?.accounts[0].holderName).toBe('João');
  });

  it('deve buscar uma conta por ID', async () => {
    (Account.findById as jest.Mock).mockResolvedValue(mockAccounts[0]);

    const query = `
      query {
        account(id: "1") {
          id
          holderName
          balance
        }
      }
    `;

    const result = await graphql({
      schema,
      source: query,
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.account.holderName).toBe('João');
  });
});
