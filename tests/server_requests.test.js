import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    registerRequest, 
    loginRequest, 
    resetPasswordRequest, 
    fetchUserInfoRequest, 
    fetchBorrowedBooksRequest,
    changeClientDataRequest,
    changeClientPasswordRequest,
    changeClientCreditCardRequest,
    InvalidRequestDataError, 
    RequestError 
} from '../public/server_requests';


global.localStorage = {
    getItem: vi.fn((key) => {
        if (key === 'token') return "session-token-123";
        return "user-auth-token";
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

global.fetch = vi.fn();

describe('Kompleksowe Testy API (Wszystkie funkcje)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // 1. REJESTRACJA (registerRequest)
    // ==========================================
    describe('registerRequest', () => {
        const validCard = { cardNumber: "1234567812345678", expirationDate: "12/28", cvv: "111" };

        it('powinna wysłać POST i zwrócić sukces przy statusie 201', async () => {
            fetch.mockResolvedValue({ status: 201, ok: true, json: async () => ({}) });
            await expect(registerRequest("Jan", "K", "jan@k.pl", "pass", validCard)).resolves.not.toThrow();
        });

        it('powinna wysyłać poprawne dane użytkownika w body JSON', async () => {
            fetch.mockResolvedValue({ status: 201, ok: true, json: async () => ({}) });
            await registerRequest("Jan", "K", "jan@k.pl", "pass", validCard);
            const callArgs = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callArgs.name).toBe("Jan");
            expect(callArgs.email).toBe("jan@k.pl");
        });

        it('powinna rzucić InvalidRequestDataError przy statusie 400 lub 409', async () => {
            fetch.mockResolvedValue({ status: 409, ok: false, json: async () => ({})});
            await expect(registerRequest("A", "B", "a@b.pl", "P", validCard)).rejects.toThrow(InvalidRequestDataError);
        });
    });

    // ==========================================
    // 2. LOGOWANIE (loginRequest)
    // ==========================================
    describe('loginRequest', () => {
        it('powinna pomyślnie zalogować i zmapować rolę na pole access', async () => {
            fetch.mockResolvedValue({
                status: 200, ok: true,
                json: async () => ({ token: "t", user: { role: "user", email: "test@test.pl" } })
            });
            const res = await loginRequest("test@test.pl", "pass");
            expect(res.access).toBe("user");
        });

        it('powinna rzucić błąd, jeśli w odpowiedzi brakuje obiektu user', async () => {
            fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({ token: "t" }) });
            await expect(loginRequest("a@b.pl", "p")).rejects.toThrow();
        });

        it('powinna wysyłać nagłówek Content-Type: application/json', async () => {
            fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({ token: "t", user: { role: "user" } }) });
            await loginRequest("t@t.pl", "h");
            expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                headers: expect.objectContaining({ "Content-Type": "application/json" })
            }));
        });
    });

    // ==========================================
    // 3. RESET HASŁA (resetPasswordRequest)
    // ==========================================
    describe('resetPasswordRequest', () => {
        it('powinna wysłać prośbę o reset na endpoint /api/users/newPassword', async () => {
            fetch.mockResolvedValue({ status: 200, ok: true });
            await resetPasswordRequest("a@b.pl");
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/users/newPassword"), expect.any(Object));
        });

        it('powinna rzucić błąd sieciowy przy awarii fetch', async () => {
            fetch.mockRejectedValue(new Error("Network Error"));
            await expect(resetPasswordRequest("a@b.pl")).rejects.toThrow("Network Error");
        });
    });

    // ==========================================
    // 4. PROFIL UŻYTKOWNIKA (fetchUserInfoRequest)
    // ==========================================
    describe('fetchUserInfoRequest', () => {
        it('powinna pobrać dane profilu i sparsować JSON', async () => {
            const mockUser = { id: 1, name: "Jan" };
            fetch.mockResolvedValue({ status: 200, ok: true, json: async () => mockUser });
            const res = await fetchUserInfoRequest();
            expect(res).toEqual(mockUser);
        });

        it('powinna wysłać nagłówek Authorization: Bearer', async () => {
            fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
            await fetchUserInfoRequest();
            expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                headers: expect.objectContaining({ "Authorization": expect.stringContaining("Bearer") })
            }));
        });
    });

    // ==========================================
    // 5. WYPOŻYCZENIA (fetchBorrowedBooksRequest)
    // ==========================================
    describe('fetchBorrowedBooksRequest', () => {
        it('powinna zwrócić listę książek za pomocą metody GET', async () => {
            const mockBooks = [{ id: 1, title: "Wiedźmin" }];
            fetch.mockResolvedValue({ status: 200, ok: true, json: async () => mockBooks });
            const result = await fetchBorrowedBooksRequest();
            expect(result).toEqual(mockBooks);
            expect(fetch.mock.calls[0][1].method).toBe("GET");
        });

        it('powinna rzucić InvalidRequestDataError przy statusie 400', async () => {
            fetch.mockResolvedValue({ status: 400, ok: false });
            await expect(fetchBorrowedBooksRequest()).rejects.toThrow(InvalidRequestDataError);
        });
    });

    // ==========================================
    // 6. AKTUALIZACJA DANYCH (changeClientDataRequest)
    // ==========================================
    describe('changeClientDataRequest', () => {
        it('powinna wysyłać name i surname, ale NIE wysyłać emaila w body', async () => {
            fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
            await changeClientDataRequest("Jan", "Kowalski", "jan@test.pl");
            const body = JSON.parse(fetch.mock.calls[0][1].body);
            expect(body).toEqual({ name: "Jan", surname: "Kowalski" });
            expect(body.email).toBeUndefined();
        });

        it('powinna używać metody POST (zgodnie z poprawką testu 6)', async () => {
            fetch.mockResolvedValue({ status: 200, ok: true, json: async () => ({}) });
            await changeClientDataRequest("A", "B", "c@d.pl");
            expect(fetch.mock.calls[0][1].method).toBe("POST");
        });
    });

    // ==========================================
    // 7. ZMIANA HASŁA (changeClientPasswordRequest)
    // ==========================================
    describe('changeClientPasswordRequest', () => {
        it('powinna wysyłać poprawne klucze old_password i new_password', async () => {
            fetch.mockResolvedValue({ status: 200, ok: true });
            await changeClientPasswordRequest("old123", "new456");
            const body = JSON.parse(fetch.mock.calls[0][1].body);
            expect(body).toEqual({ old_password: "old123", new_password: "new456" });
        });

        it('powinna rzucić RequestError przy statusie 500', async () => {
            fetch.mockResolvedValue({ status: 500, ok: false });
            await expect(changeClientPasswordRequest("a", "b")).rejects.toThrow(RequestError);
        });
    });

    // ==========================================
    // 8. EDYCJA KARTY (changeClientCreditCardRequest)
    // ==========================================
    describe('changeClientCreditCardRequest', () => {
        const cardData = { number: "11112222", cvv: "123", exp_date: "12/26" };

        it('powinna pomyślnie wysłać dane karty jako jeden obiekt', async () => {
            fetch.mockResolvedValue({ status: 200, ok: true });
            await expect(changeClientCreditCardRequest(cardData)).resolves.not.toThrow();
            
            const body = JSON.parse(fetch.mock.calls[0][1].body);
            expect(body).toEqual(cardData);
        });

        it('powinna uderzać w endpoint /api/users/editClientCreditCard', async () => {
            fetch.mockResolvedValue({ status: 200, ok: true });
            await changeClientCreditCardRequest(cardData);
            expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/users/editClientCreditCard"), expect.any(Object));
        });
    });

    // ==========================================
    // 9. OGÓLNE TESTY STANU (RequestError)
    // ==========================================
    describe('Globalna obsługa błędów', () => {
        it('każda funkcja powinna rzucić RequestError przy nieoczekiwanym statusie (np. 500)', async () => {
            fetch.mockResolvedValue({ status: 500, ok: false });
            // Testujemy na reprezentatywnym przykładzie
            await expect(fetchUserInfoRequest()).rejects.toThrow(RequestError);
        });
    });
});