/**
 * @file Register.tsx
 * @description Formularz rejestracji użytkownika z walidacją danych
 * oraz wysyłką żądania utworzenia konta do serwera.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./register.css";
import { validators } from "../../public/validators";
import { RegisterRequest } from "../../public/server_requests";

function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // ===== WALIDACJA =====
    if (!validators.firstName(firstName).ok) {
      setError("Nieprawidłowe imię.");
      return;
    }

    if (!validators.lastName(lastName).ok) {
      setError("Nieprawidłowe nazwisko.");
      return;
    }

    if (!validators.email(email).ok) {
      setError("Nieprawidłowy adres e-mail.");
      return;
    }

    if (!validators.password(password).ok) {
      setError("Hasło nie spełnia wymagań bezpieczeństwa.");
      return;
    }

    if (!validators.cardNum(cardNumber).ok) {
      setError("Nieprawidłowy numer karty.");
      return;
    }

    if (!exp) {
      setError("Podaj datę wygaśnięcia karty.");
      return;
    }

    if (!validators.cvv(cvv).ok) {
      setError("Nieprawidłowy CVV.");
      return;
    }

    if (!privacyPolicy) {
      setError("Musisz zaakceptować regulamin i politykę prywatności.");
      return;
    }

    // ===== REQUEST =====
    const response = RegisterRequest(
      firstName,
      lastName,
      email,
      password,
      cardNumber,
      exp,
      cvv,
    );

    if (response.return_code !== 0) {
      setError(response.error_message ?? "Błąd rejestracji.");
      return;
    }

    setSuccess("Konto zostało utworzone. Możesz się zalogować.");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="center-screen">
      <form
        className="login-panel"
        style={{ width: "22em" }}
        onSubmit={handleSubmit}
        method="post"
      >
        <h2 style={{ textAlign: "center", marginBottom: "18px" }}>
          Rejestracja
        </h2>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label htmlFor="firstName">Imię</label>
            <input
              id="firstName"
              type="text"
              placeholder="Imię"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="lastName">Nazwisko</label>
            <input
              id="lastName"
              type="text"
              placeholder="Nazwisko"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="adres@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password">Hasło</label>
          <input
            id="password"
            type="password"
            placeholder="Hasło"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="cardNumber">Numer karty</label>
          <input
            id="cardNumber"
            type="tel"
            inputMode="numeric"
            placeholder="Numer karty"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label htmlFor="exp">Data wygaśnięcia</label>
            <input
              id="exp"
              type="month"
              autoComplete="cc-exp"
              value={exp}
              onChange={(e) => setExp(e.target.value)}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="cvv">CVV</label>
            <input
              id="cvv"
              type="tel"
              inputMode="numeric"
              placeholder="CVV"
              autoComplete="cc-csc"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
            />
          </div>
        </div>

        <div className="checkbox-container">
          <input
            type="checkbox"
            id="privacyPolicy"
            checked={privacyPolicy}
            onChange={(e) => setPrivacyPolicy(e.target.checked)}
          />
          <a id="privacyPolicyLabel" href="#">
            Akceptuję regulamin i politykę prywatności.
          </a>
        </div>

        <button type="submit">Zarejestruj się</button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        {success && <p style={{ color: "green", marginTop: 10 }}>{success}</p>}

        <p className="muted">
          Masz już konto? <a href="/login">Zaloguj się</a>
        </p>
      </form>
    </div>
  );
}

export default Register;
