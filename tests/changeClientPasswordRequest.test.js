import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changeClientPasswordRequest } from '../public/server_requests';
import { InvalidRequestDataError, RequestError } from '../public/server_requests';

/**
 * MOCKOWANIE ŚRODOWISKA
 * localStorage: Twoja funkcja używa klucza 'token'.
 */
global.localStorage = {
    getItem: vi.fn(() => "session-token-123"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

global.fetch = vi.fn();

describe('changeClientPasswordRequest - Testy zmiany hasła', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TEST 1: Sukces operacji
     */
    it('1. powinna pomyślnie zmienić hasło przy statusie 200', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });

        await expect(changeClientPasswordRequest("stareHaslo", "noweHaslo"))
            .resolves.not.toThrow();
    });

    /**
     * TEST 2: Weryfikacja Body (JSON)
     * Sprawdzamy, czy argumenty funkcji trafiają pod odpowiednie klucze w JSONie.
     */
    it('2. powinna wysyłać poprawne klucze w body (old_password, new_password)', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        const oldP = "secret123";
        const newP = "newSecret456";
        
        await changeClientPasswordRequest(oldP, newP);
        
        const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
        
        expect(sentBody).toEqual({
            old_password: oldP,
            new_password: newP
        });
    });

    /**
     * TEST 3: Autoryzacja i Nagłówki
     * Sprawdzamy, czy token jest pobierany i wysyłany jako Bearer.
     */
    it('3. powinna pobierać token z localStorage i wysyłać go w nagłówku', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        await changeClientPasswordRequest("a", "b");
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Authorization": "Bearer session-token-123",
                    "Content-Type": "application/json"
                })
            })
        );
    });

    /**
     * TEST 4: Metoda i Endpoint
     */
    it('4. powinna używać metody POST i uderzać w /api/users/newPassword', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        await changeClientPasswordRequest("a", "b");
        
        const [url, config] = fetch.mock.calls[0];
        
        expect(url).toBe("/api/users/newPassword");
        expect(config.method).toBe("POST");
    });

    /**
     * TEST 5: Błąd danych (400)
     * W Twoim kodzie status 400 rzuca InvalidRequestDataError.
     */
    it('5. powinna rzucić InvalidRequestDataError przy statusie 400', async () => {
        fetch.mockResolvedValue({
            status: 400,
            ok: false,
            json: async () => ({})
        });

        // Sprawdzamy czy rzuca błąd z Twoim customowym komunikatem
        await expect(changeClientPasswordRequest("złe", "nowe"))
            .rejects.toThrow(InvalidRequestDataError);
    });

    /**
     * TEST 6: Błąd serwera (np. 500)
     * Wszystkie inne statusy rzucają ogólny RequestError.
     */
    it('6. powinna rzucić RequestError przy statusie 500', async () => {
        fetch.mockResolvedValue({
            status: 500,
            ok: false,
            json: async () => ({})
        });

        await expect(changeClientPasswordRequest("a", "b"))
            .rejects.toThrow(RequestError);
    });

    /**
     * TEST 7: Wyjątek sieciowy
     */
    it('7. powinna rzucić błąd w przypadku awarii sieci (fetch fail)', async () => {
        fetch.mockRejectedValue(new Error("Network Failure"));

        await expect(changeClientPasswordRequest("a", "b"))
            .rejects.toThrow("Network Failure");
    });
});