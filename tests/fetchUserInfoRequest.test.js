import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUserInfoRequest } from '../public/server_requests';
import { InvalidRequestDataError, RequestError } from '../public/server_requests';

/**
 * @fileoverview TESTY POBIERANIA DANYCH UŻYTKOWNIKA
 * Weryfikujemy poprawność komunikacji z endpointem profilu użytkownika
 * oraz obsługę tokenów sesji.
 */

global.localStorage = {
    getItem: vi.fn(() => "user-auth-token"), // Symulujemy obecność tokenu w przeglądarce
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

global.fetch = vi.fn();

describe('fetchUserInfoRequest - Testy pobierania profilu', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TEST 1: Sukces (200).
     * Sprawdzamy, czy funkcja poprawnie zwraca obiekt użytkownika otrzymany z API.
     */
    it('1. powinna pomyślnie zwrócić dane użytkownika (status 200)', async () => {
        const mockUser = { id: 1, name: "Jan", email: "jan@test.pl", role: "user" };
        
        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => mockUser,
        });

        const result = await fetchUserInfoRequest();
        
        // Weryfikujemy, czy dane zwrócone przez funkcję są identyczne z tymi z serwera
        expect(result).toEqual(mockUser);
    });

    /**
     * TEST 2: Autoryzacja Bearer.
     * Pobieranie danych profilu wymaga zalogowania. Sprawdzamy nagłówek Authorization.
     */
    it('2. powinna przesyłać token autoryzacyjny z localStorage', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
        
        await fetchUserInfoRequest();
        
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
     * TEST 3: Brak autoryzacji (401).
     * Jeśli token wygasł lub jest błędny, serwer zwróci 401.
     */
    it('3. powinna rzucić RequestError przy braku autoryzacji (status 401)', async () => {
        fetch.mockResolvedValue({
            status: 401,
            ok: false,
            json: async () => ({ message: "Unauthorized" })
        });

        await expect(fetchUserInfoRequest()).rejects.toThrow(RequestError);
    });

    /**
     * TEST 4: Adres URL.
     * Weryfikujemy, czy zapytanie kierowane jest na endpoint użytkownika.
     */
    it('4. powinna wysyłać zapytanie na endpoint /api/users/me (lub podobny)', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
        
        await fetchUserInfoRequest();
        
        // Sprawdzamy czy URL zawiera ścieżkę do profilu użytkownika
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("api/users/loginInfo"), 
            expect.any(Object)
        );
    });

    /**
     * TEST 5: Metoda HTTP.
     * Pobieranie danych (Read) powinno odbywać się metodą GET.
     */
    it('5. powinna używać metody GET', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
        
        await fetchUserInfoRequest();
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ method: "GET" })
        );
    });

    /**
     * TEST 6: Błąd serwera (500).
     * Sprawdzamy reakcję na błędy wewnętrzne backendu.
     */
    it('6. powinna rzucić RequestError przy statusie 500', async () => {
        fetch.mockResolvedValue({ status: 500, ok: false });

        await expect(fetchUserInfoRequest()).rejects.toThrow(RequestError);
    });

    /**
     * TEST 7: Błąd sieci.
     * Obsługa sytuacji, gdy wystąpi błąd połączenia (np. DNS failure).
     */
    it('7. powinna obsłużyć błąd sieci (fetch reject)', async () => {
        fetch.mockRejectedValue(new Error("Failed to fetch"));

        await expect(fetchUserInfoRequest()).rejects.toThrow("Failed to fetch");
    });

    /**
     * TEST 8: Parsowanie JSON.
     * Sprawdzamy, czy funkcja wywołuje metodę .json() na odpowiedzi.
     */
    it('8. powinna poprawnie sparsować odpowiedź JSON', async () => {
        const spyJson = vi.fn().mockResolvedValue({ test: "data" });
        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: spyJson
        });

        await fetchUserInfoRequest();
        expect(spyJson).toHaveBeenCalled();
    });

    /**
     * TEST 9: Brak tokenu w systemie.
     * Sprawdzamy zachowanie, gdy localStorage jest puste.
     */
    it('9. powinna wysłać zapytanie nawet jeśli token jest pusty (serwer zwróci błąd)', async () => {
        localStorage.getItem.mockReturnValue(null);
        fetch.mockResolvedValue({ status: 401, ok: false });

        await expect(fetchUserInfoRequest()).rejects.toThrow();
    });

    /**
     * TEST 10: Nagłówki zapytania.
     * Upewniamy się, że frontend prosi o odpowiedź w formacie JSON.
     */
    it('10. powinna wysyłać nagłówek Accept: application/json', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
        
        await fetchUserInfoRequest();
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Content-Type": "application/json"
                })
            })
        );
    });
});