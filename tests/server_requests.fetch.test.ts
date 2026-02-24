import {describe, test, expect, expectTypeOf} from 'vitest';
import {fetchFiltersRequest, fetchUserInfoRequest} from "../src/server/requests/fetch_requests";
import {AccessDeniedError, InvalidRequestDataError, setMockAuth} from "../src/server/requests/connection";
import {BookSearchFilter} from "../src/server/server_types";
// todo: w readme musi być wytłumaczenie kiedy te testy działają
describe('Test funkcji z pliku fetch_requests.ts bez wymagań co do uprawnień', () => {
    test('Test funkcji `fetchFiltersRequest`', async () => {
        setMockAuth('noauth')
        let data = await fetchFiltersRequest();
        expect(data).to.deep.equal({
            author:['Andrzej Sapkowski', 'Janusz Tester'],
            genre:[],
            language: ['PL'],
            publisher: ['Wydawnictwo Testowe'],
            release_date: {
                from: new Date('Mon Jan 01 1990 00:00:00 GMT+0100 (czas środkowoeuropejski standardowy)'),
                to: new Date('Tue Dec 31 2024 00:00:00 GMT+0100 (czas środkowoeuropejski standardowy)')
            },
            tags: []
        } as BookSearchFilter)
        setMockAuth(false)
    })
})
describe('Test funkcji z pliku fetch_requests.ts wymagające uprawnień użytkownika', () => {
    test('Test funkcji `fetchUserInfoRequest`', async () => {
        setMockAuth('user')
        let data = await fetchUserInfoRequest();

        expect(data).to.deep.equal({
            "name": "Jan",
            "surname": "Kowalski",
            "email": "jan.kowalski@test.pl",
            "credit_card_number": "1111"
        }, 'Correct data returned from fetchUserInfoRequest')

        setMockAuth('noauth')
        await expect(fetchUserInfoRequest(), 'Test reakcji na brak sesji').rejects.toThrow('Błąd profilu')

        setMockAuth(false)
    })
})