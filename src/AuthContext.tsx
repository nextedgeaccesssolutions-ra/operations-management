import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type Account,
  type AccountRole,
  accountById,
  decide as decideInStore,
  endSession,
  migrateLegacyAccounts,
  pendingInCompany,
  accountsInCompany,
  resumeSession,
  setRole as setRoleInStore,
  signIn as signInStore,
  signUp as signUpStore,
  startSession,
} from "./auth/accountStore";

/**
 * Kept as an alias so existing imports of `User` keep compiling. The account
 * record now also carries approval state and a company-scoped role.
 */
export type User = Account;
export type { Account, AccountRole };

export interface AuthContextType {
  account: Account | null;
  loading: boolean;
  /** One-off notice about accounts carried over from the old plaintext store. */
  notice: string | null;
  dismissNotice: () => void;

  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signUp: (
    name: string,
    email: string,
    password: string,
    company: string
  ) => Promise<{ ok: boolean; error?: string; pending?: boolean }>;
  signOut: () => void;
  /** Re-read the signed-in account from the store. */
  refresh: () => void;

  /** True once the account exists AND an owner or admin has approved it. */
  approved: boolean;
  isAdmin: boolean;

  pendingRequests: Account[];
  colleagues: Account[];
  decide: (
    targetId: string,
    decision: "approve" | "reject",
    grantAdmin?: boolean
  ) => { ok: boolean; error?: string };
  changeRole: (targetId: string, role: "admin" | "member") => { ok: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  // Bumped after any store write so derived lists recompute.
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { moved, droppedDemo } = await migrateLegacyAccounts();
        if (!cancelled && (moved > 0 || droppedDemo)) {
          const parts: string[] = [];
          if (moved > 0) {
            parts.push(
              `${moved} existing account${moved === 1 ? "" : "s"} moved off the old plaintext store and re-secured`
            );
          }
          if (droppedDemo) parts.push("the seeded demo@neas.co credential was removed");
          setNotice(parts.join("; ") + ".");
        }
      } catch {
        /* migration is best effort; a failure must not block sign-in */
      }
      const resumed = resumeSession();
      if (!cancelled) {
        setAccount(resumed);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => {
    setAccount((current) => (current ? accountById(current.id) : null));
    setRevision((r) => r + 1);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await signInStore(email, password);
    if (!res.ok) return { ok: false, error: res.error };
    startSession(res.account.id);
    setAccount(res.account);
    setRevision((r) => r + 1);
    return { ok: true };
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string, company: string) => {
      const res = await signUpStore({ name, email, password, company });
      if (!res.ok) return { ok: false, error: res.error };
      // A pending account gets a session too — it needs somewhere to land and
      // see that it is waiting. The approval gate lives on `approved`, below,
      // so a session alone never grants access to company data.
      startSession(res.account.id);
      setAccount(res.account);
      setRevision((r) => r + 1);
      return { ok: true, pending: res.account.status === "pending" };
    },
    []
  );

  const signOut = useCallback(() => {
    endSession();
    setAccount(null);
    setRevision((r) => r + 1);
  }, []);

  const decide = useCallback(
    (targetId: string, decision: "approve" | "reject", grantAdmin = false) => {
      if (!account) return { ok: false, error: "Sign in first." };
      const res = decideInStore(account, targetId, decision, grantAdmin);
      setRevision((r) => r + 1);
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    },
    [account]
  );

  const changeRole = useCallback(
    (targetId: string, role: "admin" | "member") => {
      if (!account) return { ok: false, error: "Sign in first." };
      const res = setRoleInStore(account, targetId, role);
      setRevision((r) => r + 1);
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    },
    [account]
  );

  const isAdmin = account?.role === "owner" || account?.role === "admin";
  const approved = account?.status === "approved";

  const pendingRequests = useMemo(
    () => (account && isAdmin ? pendingInCompany(account.companyKey) : []),
    // revision is the dependency that makes this recompute after a write.
    [account, isAdmin, revision]
  );

  const colleagues = useMemo(
    () => (account ? accountsInCompany(account.companyKey) : []),
    [account, revision]
  );

  const value: AuthContextType = {
    account,
    loading,
    notice,
    dismissNotice: () => setNotice(null),
    signIn,
    signUp,
    signOut,
    refresh,
    approved,
    isAdmin,
    pendingRequests,
    colleagues,
    decide,
    changeRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
