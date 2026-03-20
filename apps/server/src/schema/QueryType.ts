import { GraphQLObjectType } from "graphql";
import { authQueries } from "../modules/auth/AuthQuery";
import { accountsQueries } from "../modules/accounts/AccountQuery";
import { transactionsQueries } from "../modules/transactions/queries";
import { depositsQueries } from "../modules/deposits/DepositQuery";
import { kycQueries } from "../modules/kyc/KycQuery";
import { usersQueries } from "../modules/users/queries";

/**
 * Root Query Type
 *
 * Composes queries from individual modules:
 * - authQueries: Auth/User queries (me)
 * - accountsQueries: Public account queries (account, accounts, accountsCount)
 * - usersQueries: Admin-only user queries (users)
 * - transactionsQueries: User/Admin transaction queries (transaction, transactions, transactionsCount)
 * - depositsQueries: User/Admin deposit queries (myDeposits, myDepositsCount)
 * - kycQueries: User/Admin KYC queries (myKyc)
 */
export const QueryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    ...authQueries,
    ...accountsQueries,
    ...usersQueries,
    ...transactionsQueries,
    ...depositsQueries,
    ...kycQueries,
  },
});
