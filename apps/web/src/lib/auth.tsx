import {
  useCallback,
  useEffect,
  useMemo,
  useTransition,
  useState,
  type ReactNode,
} from "react";
import { graphqlRequest } from "@/lib/graphqlClient";
import type { AuthUser } from "@/lib/auth-storage";
import { AuthContext } from "@/lib/auth-context";

const ME_QUERY = `
  query Me {
    me {
      id
      email
      role
      accountId
      kycStatus
    }
  }
`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isBootstrapping, startBootstrap] = useTransition();

  useEffect(() => {
    let active = true;

    startBootstrap(() => {
      void graphqlRequest<{
        me: {
          id: string;
          email: string;
          role: "USER" | "ADMIN";
          accountId: string | null;
          kycStatus: string;
        } | null;
      }>(ME_QUERY, {})
        .then((data) => {
          if (!active) {
            return;
          }

          if (!data.me?.accountId) {
            setUserState(null);
            return;
          }

          setUserState({
            id: data.me.id,
            email: data.me.email,
            role: data.me.role,
            accountId: data.me.accountId,
            kycStatus: (data.me.kycStatus as import("@/lib/auth-storage").KycStatus) ?? "PENDING_SUBMISSION",
          });
        })
        .catch(() => {
          if (active) {
            setUserState(null);
          }
        });
    });

    return () => {
      active = false;
    };
  }, []);

  const setUser = useCallback((nextUser: AuthUser | null) => {
    setUserState(nextUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isBootstrapping, setUser, logout }),
    [isBootstrapping, logout, setUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
