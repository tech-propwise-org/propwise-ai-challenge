import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Agent, api } from './api';

interface Session {
  token: string;
  agent: Agent;
}

interface SessionContextValue {
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Keeps the login in memory only: reloading the app signs you out. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, agent } = await api.login(email, password);
    setSession({ token: accessToken, agent });
  }, []);

  const logout = useCallback(() => setSession(null), []);

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
