import type { GraphQLContext } from "../../types/auth";
import { Account } from "../accounts/AccountModel";

/**
 * Authorization helpers — Centralized security checks
 * Following: DRY principle (no duplicated auth logic)
 *           KISS principle (simple, explicit error messages)
 *
 * Patterns:
 * - requireAuth(): Throws if no auth context
 * - requireAdmin(): Throws if not admin role
 * - assertOwnerOrAdmin(): Throws if userId doesn't match context OR not admin
 * - assertAccountOwnerOrAdmin(): Throws if user doesn't own account OR not admin
 */

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Ensures request is authenticated.
 * Throws if no auth context.
 */
export function requireAuth(context: GraphQLContext) {
  if (!context.auth) {
    throw new AuthorizationError("Usuario nao autenticado");
  }

  return context.auth;
}

/**
 * Ensures authenticated user has admin role.
 * Throws if not authenticated or not admin.
 */
export function requireAdmin(context: GraphQLContext) {
  const auth = requireAuth(context);

  if (auth.role !== "ADMIN") {
    throw new AuthorizationError("Acesso restrito a administradores");
  }

  return auth;
}

/**
 * Ensures authenticated user owns the requested userId or is admin.
 * Throws if not authenticated, or if userId doesn't match and not admin.
 *
 * Use case: Query/mutation for personal data (kyc, profile, etc)
 */
export function assertOwnerOrAdmin(
  userId: string,
  context: GraphQLContext,
) {
  const auth = requireAuth(context);

  if (auth.role === "ADMIN") {
    return; // Admin can access anyone's data
  }

  if (auth.userId !== userId) {
    throw new AuthorizationError("Sem permissao para acessar estes dados");
  }
}

/**
 * Ensures authenticated user owns the account or is admin.
 * Loads user's account to validate ownership.
 * Throws if not authenticated, account not found, or access denied.
 *
 * Use case: Query/mutation for account data (transactions, deposits, etc)
 */
export async function assertAccountOwnerOrAdmin(
  requestedAccountId: string | undefined,
  context: GraphQLContext,
) {
  const auth = requireAuth(context);

  // Admin can access any account
  if (auth.role === "ADMIN") {
    return requestedAccountId;
  }

  // Regular users can only access their own account
  const account = await Account.findOne({ userId: auth.userId });

  if (!account) {
    throw new AuthorizationError("Conta do usuario nao encontrada");
  }

  const authenticatedAccountId = String(account.id);

  if (requestedAccountId && requestedAccountId !== authenticatedAccountId) {
    throw new AuthorizationError("Sem permissao para acessar dados desta conta");
  }

  return authenticatedAccountId;
}

/**
 * Gets the authenticated user's account.
 * Throws if not authenticated or account not found.
 *
 * Use case: Simple "my account" access (e.g., myDeposits, myKyc)
 */
export async function getAuthenticatedAccount(context: GraphQLContext) {
  const auth = requireAuth(context);
  const account = await Account.findOne({ userId: auth.userId });

  if (!account) {
    throw new AuthorizationError("Conta do usuario nao encontrada");
  }

  return account;
}
