import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerRequest } from '../public/server_requests';
import { InvalidRequestDataError, RequestError } from '../public/server_requests';

/**
 * @fileoverview Testy jednostkowe dla funkcji registerRequest.
 * Dokumentacja API uwzględnia statusy: 201 (OK), 400 (Błąd danych), 409 (Duplikat), 500 (Błąd serwera).
 */

// Symulacja środowiska przeglądarkowego (Node.js domyślnie nie posiada localStorage)
global.localStorage = {
    getItem: vi.fn(() => "fake-token"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

// Mockowanie globalnej funkcji fetch, aby zapobiec prawdziwym zapytaniom sieciowym
global.fetch = vi.fn();

describe('registerRequest - Kompleksowe testy (Poprawione)', () => {
    
    beforeEach(() => {
        // Resetowanie stanów mocków przed każdym przypadkiem testowym
        vi.clearAllMocks();
    });

    const validCard = { 
        cardNumber: "1234567812345678", 
        expirationDate: "12/28", 
        cvv: "111" 
    };

    /**
     * SCENARIUSZE SUKCESU
     */
    it('1. powinna zakończyć się sukcesem (status 201)', async () => {
        // Symulacja poprawnej odpowiedzi serwera zgodnie z dokumentacją
        fetch.mockResolvedValue({
            status: 201,
            ok: true,
            json: async () => ({ message: "Utworzono" }),
        });

        await expect(registerRequest("Adam", "Nowak", "adam@test.pl", "Haslo123!", validCard))
            .resolves.not.toThrow();
    });

    /**
     * OBSŁUGA BŁĘDÓW LOGICZNYCH (4xx)
     */
    it('2. powinna rzucić InvalidRequestDataError przy statusie 409', async () => {
        // 409 Conflict - Użytkownik o podanym e-mailu już istnieje w bazie
        fetch.mockResolvedValue({
            status: 409,
            ok: false,
            json: async () => ({ message: "Użytkownik istnieje" }),
        });

        await expect(registerRequest("Jan", "Kowalski", "exists@test.pl", "Haslo1", validCard))
            .rejects.toThrow(InvalidRequestDataError);
    });

    it('10. powinna rzucić błąd przy statusie 400', async () => {
        // 400 Bad Request - Niepoprawne dane wejściowe lub brak wymaganych pól
        fetch.mockResolvedValue({ status: 400, ok: false, json: async () => ({}) });
        await expect(registerRequest("A", "B", "a@b.pl", "P", validCard)).rejects.toThrow();
    });

    /**
     * OBSŁUGA BŁĘDÓW TECHNICZNYCH (5xx i Sieć)
     */
    it('3. powinna rzucić RequestError przy krytycznym błędzie serwera (status 500)', async () => {
        // Błąd po stronie bazy danych lub awaria usługi mailowej na backendzie
        fetch.mockResolvedValue({
            status: 500,
            ok: false,
            json: async () => ({})
        });

        await expect(registerRequest("Jan", "Zly", "error@test.pl", "123", validCard))
            .rejects.toThrow(RequestError);
    });

    it('7. powinna rzucić błąd sieci (fetch reject)', async () => {
        // Scenariusz: utrata połączenia z internetem lub timeout serwera
        fetch.mockRejectedValue(new Error("Network Error"));
        await expect(registerRequest("A", "B", "a@b.pl", "P", validCard))
            .rejects.toThrow("Network Error");
    });

    /**
     * WERYFIKACJA KONTRAKTU (Struktura zapytania HTTP)
     */
    it('4. powinna wysyłać żądanie na poprawny endpoint', async () => {
        fetch.mockResolvedValue({ status: 201, ok: true, json: async () => ({}) });
        await registerRequest("A", "B", "a@b.pl", "P", validCard);
        
        // Sprawdzenie czy URL zawiera wymaganą ścieżkę API
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("api/users/register"),
            expect.any(Object)
        );
    });

    it('6. powinna wysyłać poprawne dane użytkownika w body JSON', async () => {
        fetch.mockResolvedValue({ status: 201, ok: true, json: async () => ({}) });
        await registerRequest("Jan", "K", "jan@k.pl", "pass", validCard);
        
        // Parsowanie body wysłanego przez fetch w celu weryfikacji pól
        const callArgs = JSON.parse(fetch.mock.calls[0][1].body);
        expect(callArgs.name).toBe("Jan");
        expect(callArgs.surname).toBe("K");
        expect(callArgs.email).toBe("jan@k.pl");
    });

    it('8. powinna wysyłać metodę POST', async () => {
        // Zgodnie ze specyfikacją REST, tworzenie zasobu musi używać metody POST
        fetch.mockResolvedValue({ status: 201, ok: true, json: async () => ({}) });
        await registerRequest("A", "B", "a@b.pl", "P", validCard);
        expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: "POST" }));
    });

    it('9. powinna wysyłać nagłówek application/json', async () => {
        // Serwer wymaga Content-Type, aby poprawnie sparsować body JSON
        fetch.mockResolvedValue({ status: 201, ok: true, json: async () => ({}) });
        await registerRequest("A", "B", "a@b.pl", "P", validCard);
        expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            headers: expect.objectContaining({ "Content-Type": "application/json" })
        }));
    });
});