/**
 * @file PasswordReset.tsx
 * @description Formularz resetowania hasła użytkownika
 * z walidacją adresu e-mail i wysyłką żądania do serwera.
 */

import React, { useState } from "react";
import { validators } from "../../public/validators";
import { ResetPasswordRequest } from "../../public/server_requests";


function PasswordReset() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

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
    <div className="center-screen">
      <form className="login-panel" onSubmit={handleSubmit} method="post">
        <h2 style={{ textAlign: "center", marginBottom: 0 }}>
          Reset hasła
        </h2>

        <p style={{ textAlign: "center", marginBottom: 10 }}>
          Podaj e-mail, na który chcesz otrzymać tymczasowe hasło.
        </p>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button type="submit">Wyślij tymczasowe hasło</button>

        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      </form>
    </div>
  );
}

export default PasswordReset;
