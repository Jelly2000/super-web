'use client';

import { createContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
}

export interface AppContextValue {
  user: AppUser | null;
  token: string | null;
  setSession: (user: AppUser | null, token: string | null) => void;
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      token,
      setSession: (nextUser, nextToken) => {
        setUser(nextUser);
        setToken(nextToken);
      },
    }),
    [user, token]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
