/**
 * @file UserAuth.tsx
 * @description Kontekst uwierzytelniania użytkownika: logowanie, wylogowanie,
 * zarządzanie sesją oraz ochrona tras. Implementacja wykorzystuje React Context.
 * @author Szymon Doba
 */

import React, { type ReactNode, createContext, useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { type Session, type User } from "./server_types.ts";

/**
 * Typ kontekstu autoryzacji.
 * @type AuthContextType
 * @property {Session | null} session - Aktualna sesja.
 * @property {(data:User, access: 'user'|'admin', token:string) => void} login - Funkcja ustawiająca sesję użytkownika.
 * @property {() => void} logout - Funkcja usuwająca sesję.
 */
export interface AuthContextType {
  session: Session | null;
  login: (data: User, access: 'user'|'admin', token: string) => void;
  logout: () => void;
}

/**
 * Kontekst uwierzytelniania użytkownika.
 * @type {React.Context<AuthContextType | undefined>}
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider przechowujący dane sesji użytkownika.
 * Odpowiada za trwałe przechowywanie sesji w localStorage.
 * @param {Object} props
 * @param {ReactNode} props.children - Komponenty potomne.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem("session");
    return saved ? JSON.parse(saved) : null;
  });

  /**
   * Logowanie — zapisuje dane użytkownika oraz token sesji.
   * @param {User} user
   * @param {'admin'|'user'} access
   * @param {string} token
   */
  const login = (user: User, access: 'admin'|'user', token: string) => {
    const newSession: Session = { user, access, token };
    setSession(newSession);
    localStorage.setItem("session", JSON.stringify(newSession));
  };

  /**
   * Wylogowanie — usuwa sesję i czyści localStorage.
   */
  const logout = () => {
    setSession(null);
    localStorage.removeItem("session");
  };

  useEffect(() => {
    if (session) localStorage.setItem("session", JSON.stringify(session));
  }, [session]);

  // umożliwia testy w konsoli
  // @ts-ignore
  window.auth = { login, logout };

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Ochrona tras — umożliwia dostęp wyłącznie określonym typom użytkowników.
 * @param {Object} props
 * @param {('admin'|'user'|null)} props.mode - Wymagany typ użytkownika.
 * @param {ReactNode} props.children
 * @param {string} [props.reroute_path]
 */
export function ProtectedRoute({mode, children, reroute_path,}: {mode: "admin" | "user" | Array<"admin" | "user"> | null; children: ReactNode; reroute_path?: string;}) {
  const auth = useContext(AuthContext);
  const access = auth?.session?.access ?? null;

  //niezalogowany użytkownik próbuje wejść w trasę chronioną
  if (!access && mode !== null) {
    return <Navigate to="/login" />;
  }

  //zalogowany użytkownik próbuje wejść w trasę publiczną (login, register)
  if (access && mode === null) {
    return <Navigate to="/catalog" />;
  }

  //zalogowany, ale zła rola
  if (
  mode &&
  (Array.isArray(mode)? !mode.includes(access as any): access !== mode)) {
    return <Navigate to={reroute_path ?? "/access-denied"} />;
  }

  return children;
}

