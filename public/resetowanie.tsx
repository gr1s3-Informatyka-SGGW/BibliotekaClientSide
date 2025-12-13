/**
 * @file Resetowanie.tsx
 * @description Reset hasła użytkownika zgodny z RequestResponse
 */

import React, { useState } from "react";
import { validators } from "./validators";
import { ResetPasswordRequest } from "./server_requests";

export default function Resetowanie() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validators.email(email).ok) {
      setMsg("Nieprawidłowy adres e-mail.");
      return;
    }

    const response = ResetPasswordRequest(email);

    if (response.return_code !== 0) {
      setMsg(response.error_message ?? "Błąd resetowania hasła.");
      return;
    }

    setMsg("Tymczasowe hasło zostało wysłane na e-mail.");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset hasła</h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail"
      />

      <button type="submit">Resetuj</button>

      {msg && <p>{msg}</p>}
    </form>
  );
}
