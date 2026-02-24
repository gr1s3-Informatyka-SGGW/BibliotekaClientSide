import {describe, test, expect, expectTypeOf} from 'vitest';
import {fetchFiltersRequest, fetchUserBookRequest, fetchUserInfoRequest} from "../src/server/requests/fetch_requests";
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
        setMockAuth('blocked')
        data = await fetchUserInfoRequest()
        expect(data).to.deep.equal({
            "name": "Anna",
            "surname": "Nowak",
            "email": "anna.nowak@test.pl",
            "credit_card_number": undefined
        }, 'Correct data returned from fetchUserInfoRequest (blocked user)')
        setMockAuth('noauth')

        await expect(fetchUserInfoRequest(), 'Test reakcji na brak sesji').rejects.toThrow('Błąd profilu')


        setMockAuth(false)
    })
    test('Test funkcji `fetchUserBookRequest`', async () => {
        setMockAuth('user')
        let data = await fetchUserBookRequest(1);
        expect(data).to.deep.equal({
            "book_id": 1,
            "title": "Wiedźmin",
            "authors": [
                "Andrzej Sapkowski"
            ],
            "publish_year": 1990,
            "isbn_number": "111",
            "keywords": [],
            "genre": [],
            "instances": {
                "available": 1,
                "total": 2
            },

            language: undefined,
            length: undefined,
            publisher: undefined
        })
        data = await fetchUserBookRequest(2);
        expect(data).to.deep.equal({
            "book_id": 2,
            "title": "Testowanie Softu",
            "authors": [
                "Janusz Tester"
            ],
            "publish_year": 2024,
            "isbn_number": "222",
            "keywords": [],
            "genre": [],
            "instances": {
                "available": 1,
                "total": 3
            },

            language: undefined,
            length: undefined,
            publisher: undefined
        })
        await expect(fetchUserBookRequest(3)).rejects.toThrow('Nie znaleziono książki')

    })
})