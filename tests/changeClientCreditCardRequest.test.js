import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changeClientCreditCardRequest } from '../public/server_requests';
import { InvalidRequestDataError, RequestError } from '../public/server_requests';

// Mockowanie localStorage - Twoja funkcja używa klucza 'token'
global.localStorage = {
    getItem: vi.fn(() => "mocked-jwt-token"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

global.fetch = vi.fn();

describe('changeClientCreditCardRequest - Testy edycji karty', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Dane testowe zgodne z Twoim typem CreditCardInfo
    const validCardData = {
        number: "1234567812345678",
        cvv: "123",
        exp_date: "12/26"
    };

    it('1. powinna pomyślnie wysłać dane karty (status 200)', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });

        await expect(changeClientCreditCardRequest(validCardData))
            .resolves.not.toThrow();
    });

    it('2. powinna używać klucza "token" z localStorage', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        await changeClientCreditCardRequest(validCardData);
        
        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Authorization": "Bearer mocked-jwt-token"
                })
            })
        );
    });

    it('3. powinna wysyłać poprawny JSON (number, cvv, exp_date)', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        await changeClientCreditCardRequest(validCardData);
        
        const sentBody = JSON.parse(fetch.mock.calls[0][1].body);
        
        // Teraz pola będą się zgadzać z Twoją funkcją
        expect(sentBody).toEqual({
            number: validCardData.number,
            cvv: validCardData.cvv,
            exp_date: validCardData.exp_date
        });
    });

    it('4. powinna uderzać w poprawny endpoint /api/users/editClientCreditCard', async () => {
        fetch.mockResolvedValue({ status: 200, ok: true });
        
        await changeClientCreditCardRequest(validCardData);
        
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/users/editClientCreditCard"), 
            expect.any(Object)
        );
    });

    it('5. powinna rzucić InvalidRequestDataError przy statusie 400', async () => {
        fetch.mockResolvedValue({
            status: 400,
            ok: false,
            json: async () => ({})
        });

        await expect(changeClientCreditCardRequest(validCardData))
            .rejects.toThrow(InvalidRequestDataError);
    });

    it('6. powinna rzucić RequestError przy innych błędach (np. 500)', async () => {
        fetch.mockResolvedValue({
            status: 500,
            ok: false,
            json: async () => ({})
        });

        await expect(changeClientCreditCardRequest(validCardData))
            .rejects.toThrow(RequestError);
    });
});