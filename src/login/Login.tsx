/**
 * @file Login.tsx
 * @description Formularz logowania z walidacją i obsługą AuthContext.
 */

import React, { useContext, useState } from "react";
import { useNavigate} from "react-router-dom";
import { validators } from "../server/validators.ts";
import { AuthContext } from "../server/UserAuth.tsx";
import {type Session} from '../server/server_types.ts'
import { RequestError, loginRequest } from "../server/server_requests.ts";

function Login() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!auth) {
    throw new Error("Login must be used inside AuthProvider");
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validators.email(email).ok) {
      setError("Nieprawidłowy adres e-mail.");
      return;
    }

    if (!validators.password(password).ok) {
      setError("Hasło nie spełnia wymagań bezpieczeństwa.");
      return;
    }
    let response;
    try {
        response = loginRequest(email, password);
    }
    catch(er: unknown){
        const error = er as Error;
        setError(error.message ?? "Błąd logowania.");
        return;
    }

    const { user, access, token }: Session = response;

    auth.login(user, access, token);
    navigate(access === "admin" ? "/admin" : "/catalog");
  };

  return (
    <div className="center-screen">
      <form className="login-panel" onSubmit={handleSubmit} method="post">
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Logowanie
        </h2>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Zaloguj się</button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

        <a href="/password-reset" className="forgot-password">
          Zapomniałem hasła
        </a>

        <p className="muted">
          Nie masz konta? <a href="/register">Zarejestruj się</a>
        </p>
      </form>
    </div>
  );
}

export default Login;
