/**
 * @file UserAuth.tsx
 * @description Kontekst uwierzytelniania użytkownika: logowanie, wylogowanie,
 * zarządzanie sesją oraz ochrona tras. Implementacja wykorzystuje React Context.
 */

import React, { type ReactNode, createContext, useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { type Session, type User } from "./db_types";
import { LoginRequest } from "./server_requests";


/**
 * Typ kontekstu autoryzacji.
 * @typedef {Object} AuthContextType
 * @property {Session | null} session - Aktualna sesja.
 * @property {(data:User, token:string) => void} login - Funkcja ustawiająca sesję użytkownika.
 * @property {() => void} logout - Funkcja usuwająca sesję.
 */
export interface AuthContextType {
  session: Session | null;
  login: (data: User, token: string) => void;
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
   * @param {string} token
   */
  const login = (user: User, token: string) => {
    const newSession: Session = { user, token };
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
  const userType = auth?.session?.user?.type ?? null;

  //niezalogowany użytkownik próbuje wejść w trasę chronioną
  if (!userType && mode !== null) {
    return <Navigate to="/login" />;
  }

  //zalogowany użytkownik próbuje wejść w trasę publiczną (login, register)
  if (userType && mode === null) {
    return <Navigate to="/catalog" />;
  }

  //zalogowany, ale zła rola
  if (
  mode &&
  (Array.isArray(mode)? !mode.includes(userType as any): userType !== mode)) {
    return <Navigate to={reroute_path ?? "/access-denied"} />;
  }

  return children;
}

