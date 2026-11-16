'use client';

import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Agent, api } from './api';

const STORAGE_KEY = 'propwise-challenge-session';

interface Session {
  token: string;
  agent: Agent;
}

interface SessionContextValue {
  session: Session | null;
  /** False until the saved session has been read from the browser. */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setSession(JSON.parse(saved) as Session);
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, agent } = await api.login(email, password);
    const next = { token: accessToken, agent };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, ready, login, logout }), [session, ready, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

/** Returns the session, sending the visitor to /login when there is none. */
export function useRequiredSession(): Session | null {
  const { session, ready } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (ready && !session) router.replace('/login');
  }, [ready, session, router]);
  return session;
}
