import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBorrowedBooksRequest } from '../public/server_requests';
import { InvalidRequestDataError, RequestError } from '../public/server_requests';

/**
 * MOCKOWANIE ŚRODOWISKA
 */
global.localStorage = {
    getItem: vi.fn(() => "valid-token-xyz"), // Symulujemy zalogowanego użytkownika
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

global.fetch = vi.fn();

describe('fetchBorrowedBooksRequest - Testy pobierania wypożyczonych książek', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * DANE TESTOWE
     * Symulujemy tablicę obiektów Book, którą powinien zwrócić serwer.
     */
    const mockBooks = [
        { id: 1, title: "Wiedźmin", author: "Andrzej Sapkowski" },
        { id: 2, title: "Hobbit", author: "J.R.R. Tolkien" }
    ];

    it('1. powinna pomyślnie zwrócić listę książek przy statusie 200', async () => {
        // Mockujemy odpowiedź 200 z danymi w formacie JSON
        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => mockBooks
        });

        const result = await fetchBorrowedBooksRequest();

        // Sprawdzamy, czy funkcja zwróciła dokładnie to, co wysłał serwer
        expect(result).toEqual(mockBooks);
        expect(result).toHaveLength(2);
    });

    it('2. powinna używać metody GET (brak body)', async () => {
        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => []
        });

        await fetchBorrowedBooksRequest();

        const config = fetch.mock.calls[0][1];
        
        // W metodzie GET nie wysyłamy body, sprawdzamy tylko metodę
        expect(config.method).toBe("GET");
        expect(config.body).toBeUndefined(); 
    });

    it('3. powinna wysyłać poprawny token Bearer w nagłówkach', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => [] });

        await fetchBorrowedBooksRequest();

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Authorization": "Bearer valid-token-xyz"
                })
            })
        );
    });

    it('4. powinna uderzać w poprawny endpoint /api/users/borrowedBooks', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true, json: async () => [] });

        await fetchBorrowedBooksRequest();

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/users/borrowedBooks"),
            expect.any(Object)
        );
    });

    it('5. powinna rzucić InvalidRequestDataError przy statusie 400', async () => {
        // Symulujemy sytuację, gdy token jest nieprawidłowy/użytkownik nieistnieje
        fetch.mockResolvedValue({
            status: 400,
            ok: false
        });

        await expect(fetchBorrowedBooksRequest())
            .rejects.toThrow(InvalidRequestDataError);
    });

    it('6. powinna rzucić RequestError przy błędzie serwera 500', async () => {
        fetch.mockResolvedValue({
            status: 500,
            ok: false
        });

        await expect(fetchBorrowedBooksRequest())
            .rejects.toThrow(RequestError);
    });

    /**
     * TEST DODATKOWY: Błąd parsowania JSON
     * Co jeśli serwer zwróci status 200, ale dane nie będą JSONem?
     */
    it('7. powinna rzucić błąd, jeśli odpowiedź nie jest poprawnym JSONem', async () => {
        fetch.mockResolvedValue({
            status: 200,
            ok: true,
            json: async () => { throw new Error("SyntaxError"); }
        });

        await expect(fetchBorrowedBooksRequest()).rejects.toThrow();
    });
});