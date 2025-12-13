/**
 * @file Login.tsx
 * @description Logowanie użytkownika zgodne z RequestResponse<LoginResponse>
 */

import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validators } from "./validators";
import { AuthContext } from "./UserAuth";
import { LoginRequest } from "./server_requests";

export default function Login() {
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

    const response = LoginRequest(email, password);

    if (response.return_code !== 0 || !response.fetched_data) {
      setError(response.error_message ?? "Błąd logowania.");
      return;
    }

    const { user, token } = response.fetched_data;

    auth.login(user, token);

    navigate(user.type === "admin" ? "/admin" : "/");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Logowanie</h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Hasło"
      />

      <button type="submit">Zaloguj</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
