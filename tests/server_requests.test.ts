import {describe, it, expect} from 'vitest';
import {registerRequest, loginRequest} from '../src/server/server_requests';

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
