import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginRequest } from '../public/server_requests';
import { InvalidRequestDataError, RequestError } from '../public/server_requests';

/**
 * @fileoverview KOMPLEKSOWE TESTY LOGOWANIA
 * Sprawdzamy poprawność przesyłania danych (email/hasło) oraz logikę
 * transformacji danych serwerowych na obiekt sesji użytkownika.
 */

global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

global.fetch = vi.fn();

describe('loginRequest - Testy logowania (Pełna dokumentacja)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TEST 1: Scenariusz sukcesu i mapowanie roli.
     * Weryfikujemy, czy funkcja poprawnie zamienia serwerowe 'role' na klienckie 'access'.
     */
    it('1. powinna pomyślnie zalogować i zwrócić obiekt z polem access', async () => {
        // Dane wejściowe z serwera (Backend używa pola 'role')
        const mockServerResponse = {
            token: "fake-jwt-token",
            user: { role: "user", email: "test@test.pl" }
        };

        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => mockServerResponse,
        });

        const result = await loginRequest("test@test.pl", "Haslo123!");
        
        // Sprawdzamy, czy funkcja dodała pole 'access' wymagane przez frontend
        expect(result).toEqual({
            token: "fake-jwt-token",
            user: mockServerResponse.user,
            access: "user" 
        });
    });

    /**
     * TEST 2: Logika uprawnień administratora.
     * Sprawdzamy, czy rola 'worker' jest poprawnie mapowana na dostęp 'admin'.
     */
    it('2. powinna mapować rolę "worker" na dostęp "admin"', async () => {
        const mockWorkerResponse = {
            token: "token-admina",
            user: { role: "worker", email: "admin@test.pl" }
        };

        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => mockWorkerResponse,
        });

        const result = await loginRequest("admin@test.pl", "admin123");
        
        // Weryfikacja transformacji roli: worker -> admin
        expect(result.access).toBe("admin");
    });

    /**
     * TEST 3: Obsługa błędnych danych logowania.
     * Serwer zwraca status 400, gdy hasło jest błędne lub użytkownik nie istnieje.
     */
    it('3. powinna rzucić InvalidRequestDataError przy statusie 400', async () => {
        fetch.mockResolvedValue({
            status: 400,
            ok: false,
            json: async () => ({ message: "Błędny email lub hasło" }),
        });

        // Oczekujemy, że funkcja rzuci specyficzny błąd walidacji danych
        await expect(loginRequest("zly@test.pl", "haslo"))
            .rejects.toThrow(InvalidRequestDataError);
    });

    /**
     * TEST 4: Weryfikacja formatu danych wychodzących.
     * Upewniamy się, że do serwera trafia poprawny obiekt JSON z danymi logowania.
     */
    it('4. powinna wysyłać poprawne body (email, password)', async () => {
        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => ({ token: "t", user: { role: "user" } })
        });
        
        await loginRequest("jan@k.pl", "haslo123");
        
        // Wyciągamy body z pierwszego wywołania fetch i sprawdzamy jego zawartość
        const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
        expect(sentBody).toEqual({ email: "jan@k.pl", password: "haslo123" });
    });

    /**
     * TEST 5: Krytyczny błąd serwera.
     * Sprawdzamy odporność aplikacji na status 500 (np. awaria bazy danych).
     */
    it('5. powinna rzucić RequestError przy statusie 500', async () => {
        fetch.mockResolvedValue({
            status: 500,
            ok: false,
            json: async () => ({})
        });

        // Oczekujemy rzucenia błędu technicznego (RequestError)
        await expect(loginRequest("a@b.pl", "p")).rejects.toThrow(RequestError);
    });

    /**
     * TEST 6: Poprawność adresu URL.
     * Zapobiega błędom w ścieżkach API przy refaktoryzacji kodu.
     */
    it('6. powinna wysyłać zapytanie na poprawny endpoint /login', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({ token: "t", user: { role: "user" } }) });
        
        await loginRequest("test@test.pl", "haslo");
        
        // Sprawdzamy czy adres URL zawiera wymaganą frazę
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("api/users/login"),
            expect.any(Object)
        );
    });

    /**
     * TEST 7: Metoda HTTP.
     * Logowanie zawsze musi być przesyłane metodą POST ze względów bezpieczeństwa.
     */
    it('7. powinna używać metody POST', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({ token: "t", user: { role: "user" } }) });
        
        await loginRequest("test@test.pl", "haslo");
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ method: "POST" })
        );
    });

    /**
     * TEST 8: Błędy sieciowe.
     * Symulujemy sytuację, w której serwer jest nieosiągalny (brak odpowiedzi).
     */
    it('8. powinna obsłużyć całkowity brak połączenia (Network Error)', async () => {
        fetch.mockRejectedValue(new Error("Failed to fetch"));

        await expect(loginRequest("test@test.pl", "pass"))
            .rejects.toThrow("Failed to fetch");
    });

    /**
     * TEST 9: Nagłówki zapytania.
     * Serwer musi wiedzieć, że przesyłamy dane w formacie JSON.
     */
    it('9. powinna wysyłać nagłówek Content-Type: application/json', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({ token: "t", user: { role: "user" } }) });
        
        await loginRequest("test@test.pl", "haslo");
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({ "Content-Type": "application/json" })
            })
        );
    });

    /**
     * TEST 10: Odporność na niekompletne dane.
     * Sprawdzamy jak funkcja reaguje, gdy serwer zapomni wysłać obiekt 'user'.
     */
    it('10. powinna rzucić błąd, jeśli w odpowiedzi brakuje obiektu user', async () => {
        // Serwer zwraca token, ale brakuje danych o roli
        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => ({ token: "tylko-token" }) 
        });

        // Ponieważ kod próbuje odczytać 'role' z undefined, oczekujemy błędu (TypeError)
        await expect(loginRequest("test@test.pl", "pass")).rejects.toThrow();
    });
});