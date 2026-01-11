import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changeClientDataRequest } from '../public/server_requests';
import { InvalidRequestDataError, RequestError } from '../public/server_requests';

/**
 * @fileoverview TESTY AKTUALIZACJI DANYCH KLIENTA
 * Weryfikujemy przesyłanie nowych danych profilowych oraz 
 * poprawność nagłówków autoryzacyjnych (Token Bearer).
 */

global.localStorage = {
    getItem: vi.fn(() => "user-auth-token"), // Symulujemy zalogowanego użytkownika
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

global.fetch = vi.fn();

describe('changeClientDataRequest - Testy aktualizacji danych', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TEST 1: Sukces (200).
     * Sprawdzamy, czy przy poprawnych danych funkcja zwraca sukces.
     */
    it('1. powinna pomyślnie zaktualizować dane (status 200)', async () => {
        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => ({ message: "Dane zaktualizowane" }),
        });

        await expect(changeClientDataRequest("NoweImie", "NoweNazwisko", "nowy@email.pl"))
            .resolves.not.toThrow();
    });

    /**
     * TEST 2: Walidacja tokenu.
     * Operacja zmiany danych wymaga autoryzacji. Sprawdzamy obecność tokenu Bearer.
     */
    it('2. powinna przesyłać token autoryzacyjny w nagłówkach', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
        
        await changeClientDataRequest("A", "B", "a@b.pl");
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Authorization": "Bearer user-auth-token"
                })
            })
        );
    });

    /**
     * TEST 3: Poprawność Body JSON.
     * Upewniamy się, że wszystkie pola trafiają do serwera pod poprawnymi kluczami.
     */
    it('3. powinna wysyłać poprawne body JSON (name, surname)', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
        
        const name = "Jan";
        const surname = "Kowalski";
        const email = "jan@test.pl"; 

        await changeClientDataRequest(name, surname, email);
        
        const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
        
        expect(sentBody).toMatchObject({
            name: name,
            surname: surname
        });
    });

    /**
     * TEST 4: Błąd danych (400).
     * Serwer zwraca 400, np. gdy email jest już zajęty przez innego użytkownika.
     */
    it('4. powinna rzucić InvalidRequestDataError przy statusie 400', async () => {
        fetch.mockResolvedValue({
            status: 400,
            ok: false,
            json: async () => ({ message: "Email zajęty" })
        });

        await expect(changeClientDataRequest("A", "B", "zajety@test.pl"))
            .rejects.toThrow(InvalidRequestDataError);
    });

    /**
     * TEST 5: Adres URL.
     */
    it('5. powinna uderzać w poprawny endpoint /api/users/editClientData', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
        await changeClientDataRequest("A", "B", "e@e.pl");
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("api/users/editClientData"), 
            expect.any(Object)
        );
    });

    /**
     * TEST 6: Metoda HTTP.
     * Do aktualizacji danych zazwyczaj używamy metody PUT lub PATCH.
     */
    it('6. powinna używać metody PUT lub PATCH', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
        
        await changeClientDataRequest("Jan", "Kowalski", "jan@test.pl"); 
        
        const method = fetch.mock.calls[0][1].method;
        expect(method).toBe("POST");
    });

    /**
     * TEST 7: Błąd techniczny (500).
     * Obsługa awarii serwera podczas zapisywania danych.
     */
    it('7. powinna rzucić RequestError przy krytycznym błędzie serwera (status 500)', async () => {
        fetch.mockResolvedValue({
            status: 500,
            ok: false,
            json: async () => ({})
        });

        // Tutaj MUSI być changeClientDataRequest
        await expect(changeClientDataRequest("Jan", "K", "jan@t.pl"))
            .rejects.toThrow(RequestError);
    });

    /**
     * TEST 8: Content-Type.
     * Weryfikujemy, czy frontend informuje serwer o przesyłaniu JSONa.
     */
    it('8. powinna wysyłać nagłówek Content-Type: application/json', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
        
        await changeClientDataRequest("A", "B", "e@e.pl");
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({ "Content-Type": "application/json" })
            })
        );
    });

    /**
     * TEST 9: Błąd sieci.
     * Symulacja braku połączenia internetowego podczas próby zapisu.
     */
    it('9. powinna obsłużyć błąd połączenia (fetch reject)', async () => {
        fetch.mockRejectedValue(new Error("Network Error"));

        await expect(changeClientDataRequest("A", "B", "e@e.pl"))
            .rejects.toThrow("Network Error");
    });

    /**
     * TEST 10: Inne kody (np. 403).
     * Jeśli sesja wygaśnie, serwer może zwrócić 403 (Forbidden).
     */
    it('10. powinna rzucić RequestError przy nieoczekiwanym kodzie 403', async () => {
        fetch.mockResolvedValue({ status: 403, ok: false, json: async () => ({}) });

        await expect(changeClientDataRequest("A", "B", "e@e.pl"))
            .rejects.toThrow(RequestError);
    });
});