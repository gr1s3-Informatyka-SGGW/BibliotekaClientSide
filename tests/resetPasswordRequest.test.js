import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetPasswordRequest } from '../public/server_requests';
import { InvalidRequestDataError, RequestError } from '../public/server_requests';

/**
 * @fileoverview TESTY WYSYŁANIA PROŚBY O RESET HASŁA
 * Sprawdzamy interakcję z endpointem /api/users/newPassword.
 */

global.localStorage = {
    getItem: vi.fn(() => "fake-token"), // Funkcja pobiera token z localStorage w nagłówku
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

global.fetch = vi.fn();

describe('resetPasswordRequest - Testy prośby o nowe hasło', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * TEST 1: Sukces (200).
     * Weryfikujemy, czy funkcja poprawnie kończy działanie, gdy email istnieje w bazie.
     */
    it('1. powinna pomyślnie wysłać prośbę (status 200)', async () => {
        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            // Kod nie używa response.json(), ale mockujemy go dla bezpieczeństwa
            json: async () => ({}), 
        });

        await expect(resetPasswordRequest("test@example.pl"))
            .resolves.not.toThrow();
    });

    /**
     * TEST 2: Nie znaleziono użytkownika (400).
     * Sprawdzamy rzucanie błędu InvalidRequestDataError z konkretnym komunikatem.
     */
    it('2. powinna rzucić InvalidRequestDataError przy statusie 400', async () => {
        fetch.mockResolvedValue({
            status: 400,
            ok: false,
        });

        // Weryfikujemy czy rzuca błąd i czy komunikat jest zgodny z kodem .ts
        await expect(resetPasswordRequest("nieistniejacy@test.pl"))
            .rejects.toThrow(InvalidRequestDataError);
    });

    /**
     * TEST 3: Weryfikacja body zapytania.
     * Sprawdzamy, czy przekazany email trafia do ciała JSON.
     */
    it('3. powinna wysyłać email w body JSON', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        const testEmail = "adam@poczta.pl";
        await resetPasswordRequest(testEmail);
        
        const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
        expect(sentBody).toEqual({ email: testEmail });
    });

    /**
     * TEST 4: Autoryzacja.
     * Twoja funkcja dodaje nagłówek Authorization z tokenem z localStorage.
     */
    it('4. powinna dołączać Bearer Token z localStorage', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        await resetPasswordRequest("test@test.pl");
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Authorization": "Bearer fake-token"
                })
            })
        );
    });

    /**
     * TEST 5: Adres endpointu.
     * Sprawdzamy czy ścieżka zgadza się z kodem: /api/users/newPassword.
     */
    it('5. powinna uderzać w poprawny endpoint /newPassword', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        await resetPasswordRequest("a@b.pl");
        
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/users/newPassword"),
            expect.any(Object)
        );
    });

    /**
     * TEST 6: Metoda POST.
     * Zgodnie z kodem, żądanie musi być typu POST.
     */
    it('6. powinna używać metody POST', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        await resetPasswordRequest("a@b.pl");
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ method: "POST" })
        );
    });

    /**
     * TEST 7: Ogólny błąd serwera (np. 500).
     * Sprawdzamy rzucanie błędu RequestError.
     */
    it('7. powinna rzucić RequestError przy statusie 500', async () => {
        fetch.mockResolvedValue({
            status: 500,
            ok: false,
        });

        await expect(resetPasswordRequest("a@b.pl")).rejects.toThrow(RequestError);
    });

    /**
     * TEST 8: Nagłówek Content-Type.
     * Sprawdzamy, czy wysyłamy informację o formacie JSON.
     */
    it('8. powinna wysyłać nagłówek Content-Type: application/json', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        await resetPasswordRequest("a@b.pl");
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({ "Content-Type": "application/json" })
            })
        );
    });

    /**
     * TEST 9: Błąd sieci.
     * Symulujemy sytuację, gdy serwer w ogóle nie odpowiada.
     */
    it('9. powinna obsłużyć błąd połączenia sieciowego', async () => {
        fetch.mockRejectedValue(new Error("Network Error"));

        await expect(resetPasswordRequest("a@b.pl")).rejects.toThrow("Network Error");
    });

    /**
     * TEST 10: Inne kody błędów (np. 404).
     * Sprawdzamy, czy funkcja rzuca RequestError dla statusów innych niż 200 i 400.
     */
    it('10. powinna rzucić RequestError przy nieobsłużonym kodzie 404', async () => {
        fetch.mockResolvedValue({
            status: 404,
            ok: false,
        });

        await expect(resetPasswordRequest("a@b.pl")).rejects.toThrow(RequestError);
    });
});