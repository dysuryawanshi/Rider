import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, api, type Rider } from "./api";
import { tokenStore } from "./tokenStore";

type Session = { token: string; user: Rider };

type AuthState = {
  status: "restoring" | "signedOut" | "signedIn";
  session: Session | null;
  signIn: (email: string, password: string) => Promise<Session>;
  completeSignIn: (session: Session) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("restoring");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await tokenStore.get().catch(() => null);
      if (!token) {
        if (!cancelled) setStatus("signedOut");
        return;
      }
      try {
        const { user } = await api.me(token);
        if (cancelled) return;
        setSession({ token, user });
        setStatus("signedIn");
      } catch (err) {
        // Only drop the stored token when the server rejected it; keep it through network blips.
        if (err instanceof ApiError && err.status === 401) await tokenStore.clear().catch(() => undefined);
        if (!cancelled) setStatus("signedOut");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // signIn verifies credentials and stores the token; completeSignIn switches the app to the signed-in area.
  // They are split so the sign-in screen can show its success state before navigating away.
  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api.signIn(email, password);
    await tokenStore.set(result.token);
    return { token: result.token, user: result.user };
  }, []);

  const completeSignIn = useCallback((next: Session) => {
    setSession(next);
    setStatus("signedIn");
  }, []);

  const signOut = useCallback(async () => {
    await tokenStore.clear().catch(() => undefined);
    setSession(null);
    setStatus("signedOut");
  }, []);

  const value = useMemo(
    () => ({ status, session, signIn, completeSignIn, signOut }),
    [status, session, signIn, completeSignIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** For screens inside the signed-in area, where a session is guaranteed by the layout guard. */
export function useSession(): Session {
  const { session } = useAuth();
  if (!session) throw new Error("useSession called without a session");
  return session;
}
