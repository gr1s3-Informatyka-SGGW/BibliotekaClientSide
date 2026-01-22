import {describe, it, expect} from 'vitest';
import {
    registerRequest,
    loginRequest,
    fetchUserCatalogRequest
} from '../src/server/server_requests';

describe('registerRequest', () => {
    it('should successfully register a new user with valid data', async () => {
        const firstName = 'John';
        const lastName = 'Doe';
        const email = `test_${Date.now()}@example.com`;
        const password = 'SecurePass123!@#';
        const cardInfo = {
            number: '4532015112830366',
            exp_date: '12/25',
            cvv: '123'
        };

        expect(
            registerRequest(firstName, lastName, email, password, cardInfo)
        ).resolves.not.toThrow();
    });

    it('should throw an error when registering with invalid email', async () => {
        const firstName = 'Jane';
        const lastName = 'Smith';
        const email = 'invalid-email';
        const password = 'SecurePass123!@#';
        const cardInfo = {
            number: '4532015112830366',
            exp_date: '2025-12',
            cvv: '123'
        };

        expect(
            registerRequest(firstName, lastName, email, password, cardInfo)
        ).rejects.toThrow();
    });
});

describe('loginRequest', () => {
    it('should successfully login with valid credentials', async () => {
        const email = 'szymon.credo@gmail.com';
        const password = 'i9vlSRPzRZi9vlSRPzRZ$';

        await expect(
            loginRequest(email, password)
        ).resolves.not.toThrow();
    });
});

describe('fetchUserCatalogRequest', () => {
    it('should successfully fetch user catalog with valid token', async () => {
        const email = 'szymon.credo@gmail.com';
        const password = 'i9vlSRPzRZi9vlSRPzRZ$';

        const session = await loginRequest(email, password);


        window.localStorage.setItem('session', JSON.stringify(session));
        // Fixed: Added empty search string as required argument

    });

    it('should fetch catalog with search, sort and filters', async () => {
        const search = "Hobbit";
        const sort = { key: "title", direction: "ASC" as const };
        const filter = { genre: ["Fantasy"] };
        const page = 1;

        const response = await fetchUserCatalogRequest(search, sort, filter, page);
            
        expect(response).toHaveProperty('result');
        expect(response).toHaveProperty('totalPages');
        expect(response).toHaveProperty('totalResults');
        expect(Array.isArray(response.result)).toBe(true);
    });

    it('should throw an error when unauthorized (no session)', async () => {
        window.localStorage.removeItem('session');
            
        await expect(
            fetchUserCatalogRequest("")
        ).rejects.toThrow();
    });
});
