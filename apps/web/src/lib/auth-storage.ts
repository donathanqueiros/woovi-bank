export type KycStatus =
  | "PENDING_SUBMISSION"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type AuthUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  accountId: string;
  kycStatus: KycStatus;
};

export const AUTH_STORAGE_KEY = "subli-auth-user";

export function readStoredAuthUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function writeStoredAuthUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}
