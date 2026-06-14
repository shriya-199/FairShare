import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, postJson } from "../../lib/api";
import type { User } from "../../types/domain";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: User }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const data = await postJson<{ user: User }>("/api/auth/login", { email, password });
        setUser(data.user);
      },
      async signup(name, email, password) {
        const data = await postJson<{ user: User }>("/api/auth/signup", { name, email, password });
        setUser(data.user);
      },
      async logout() {
        await postJson<void>("/api/auth/logout", {});
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
