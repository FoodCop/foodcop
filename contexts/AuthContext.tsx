// Temporary stub AuthContext after removal of legacy auth system.
// Provides a minimal interface so components depending on useAuth keep functioning
// while a new authentication solution is designed.
import React, { createContext, useContext } from 'react';

interface AuthContextValue {
  user: null;
  profile: null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

const noop = async () => { /* no-op auth stub */ };

const defaultValue: AuthContextValue = {
  user: null,
  profile: null,
  signInWithGoogle: noop,
  signUpWithEmail: noop,
  signInWithEmail: noop,
  signOut: noop,
  updateProfile: noop,
};

const AuthContext = createContext<AuthContextValue>(defaultValue);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <AuthContext.Provider value={defaultValue}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  return useContext(AuthContext);
}

// NOTE: When re-implementing auth, replace this file with real logic and update provider wiring in `App.tsx`.
