import {describe, test, expect, expectTypeOf} from 'vitest';
import {
    fetchAdminBookRequest,
    fetchAdminCatalogRequest,
    fetchBorrowedBooksRequest,
    fetchFiltersRequest, fetchReservedBooksRequest,
    fetchUserBookRequest, fetchUserCatalogRequest,
    fetchUserInfoRequest, fetchUserListRequest
} from "../src/server/requests/fetch_requests";
import {AccessDeniedError, InvalidRequestDataError, setMockAuth} from "../src/server/requests/connection";
import {BookSearchFilter} from "../src/server/server_types";
// todo: w readme musi być wytłumaczenie kiedy te testy działają
describe('Test funkcji z pliku fetch_requests.ts bez wymagań co do uprawnień', () => {
    test('Test funkcji `fetchFiltersRequest`', async () => {
        setMockAuth('noauth')
        let data = await fetchFiltersRequest();
        expect(data).to.deep.equal({
            author: ['Andrzej Sapkowski', 'Janusz Tester'],
            genre: [],
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
    test('Test funkcji `fetchBorrowedBooksRequest`', async () => {
        setMockAuth('user')
        let data = await fetchBorrowedBooksRequest();
        expect(data).to.deep.equal([{
            "book": {
                "title": "Testowanie Softu",
                "authors": [
                    "Janusz Tester"
                ],
                "publish_year": 0,
                "isbn_number": "",
                "length": 0,
                "language": "",
                "publisher": "",
                "keywords": [],
                "genre": []
            },
            "borrow_date": new Date("2026-02-24T00:00:00.000Z"),
            "return_date": new Date("2026-03-26T00:00:00.000Z")
        }])
        setMockAuth('blocked')
        let blocked_data = await fetchBorrowedBooksRequest();
        expect(blocked_data).to.deep.equal([], "For user without any borrowed books, empty array should be returned")

        setMockAuth('noauth')
        await expect(fetchBorrowedBooksRequest()).rejects.toThrow('Błąd pobierania wypożyczeń')

        setMockAuth(false)
    })
    test('Test funkcji `fetchReservedBooksRequest`', async () => {
        setMockAuth('user')

        let data = await fetchReservedBooksRequest();
        expect(data).toEqual([
            {
                book: {
                    "book_id": 1,
                    "title": "Wiedźmin",
                    "authors": [
                        "Andrzej Sapkowski"
                    ],
                    "publish_year": 0,
                    "isbn_number": "",
                    "length": 0,
                    "language": "",
                    "publisher": "",
                    "keywords": [],
                    "genre": []
                },
                "reserve_to": new Date("2026-03-10T00:00:00.000Z")
            }
        ])

        setMockAuth('noauth')
        await expect(fetchReservedBooksRequest()).rejects.toThrow('Nie znaleziono użytkownika dla tokenu')

        setMockAuth(false)
    })
    test('Test funkcji `fetchUserCatalogRequest`', async () => {
        setMockAuth('user')
        let data = await fetchUserCatalogRequest();
        expect(data, "Domyślne wyszukanie").to.deep.equal({
            "result": [{
                "book_id": "2",
                "title": "Testowanie Softu",
                "authors": ["Janusz Tester"],
                "publish_year": 2024,
                "isbn_number": "222",
                "publisher": "Wydawnictwo Testowe",
                "genre": [],
                "language": "PL",
                "length": 150,
                "instances": {"available": 1, "total": 3}
            }, {
                "book_id": "1",
                "title": "Wiedźmin",
                "authors": ["Andrzej Sapkowski"],
                "publish_year": 1990,
                "isbn_number": "111",
                "publisher": "Wydawnictwo Testowe",
                "genre": [],
                "language": "PL",
                "length": 300,
                "instances": {"available": 1, "total": 2}
            }], "totalPages": 1, "totalResults": 2
        })

        data = await fetchUserCatalogRequest("Wie");
        expect(data, "Przy filtrowaniu po tytule").to.deep.equal({
            "result": [{
                "book_id": "1",
                "title": "Wiedźmin",
                "authors": ["Andrzej Sapkowski"],
                "publish_year": 1990,
                "isbn_number": "111",
                "publisher": "Wydawnictwo Testowe",
                "genre": [],
                "language": "PL",
                "length": 300,
                "instances": {"available": 1, "total": 2}
            }], "totalPages": 1, "totalResults": 1
        })

        data = await fetchUserCatalogRequest('', undefined, undefined, 2)
        expect(data, "Gdy użyje błędnej strony").to.deep.equal({result: [], totalPages: 1, totalResults: 0})

        setMockAuth('noauth')
        await expect(fetchUserCatalogRequest(), "Gdy użytkownik niezalogowany").rejects.toThrow('Błąd pobierania katalogu: 401')


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
        setMockAuth(false)
    })
})
describe('Test funkcji z pliku fetch_requests.ts z uprawnieniami administratora', () => {
    test('Test funkcji `fetchAdminCatalogRequest`', async () => {
        setMockAuth('admin')
        let data = await fetchAdminCatalogRequest();
        expect(data, "Domyślne wyszukanie").to.deep.equal({
            "result": [{
                "book_id": 2,
                "title": "Testowanie Softu",
                "authors": ["Janusz Tester"],
                "publish_year": 2024,
                "isbn_number": "222",
                "length": 150,
                "language": "PL",
                "publisher": "Wydawnictwo Testowe",
                "keywords": [],
                "genre": [],
                "instances": [
                    {"id": 3, "status": "rented"},
                    {"id": 5, "status": "available"},
                    {"id": 4, "status": "damaged"},
                ]
            }, {
                "book_id": 1,
                "title": "Wiedźmin",
                "authors": ["Andrzej Sapkowski"],
                "publish_year": 1990,
                "isbn_number": "111",
                "length": 300,
                "language": "PL",
                "publisher": "Wydawnictwo Testowe",
                "keywords": [],
                "genre": [],
                "instances": [{"id": 2, "status": "reserved"}, {"id": 1, "status": "available"}]
            }], "totalPages": 1, "totalResults": 2
        })

        data = await fetchAdminCatalogRequest("Wie");
        expect(data, "Przy filtrowaniu po tytule").to.deep.equal({
            "result": [{
                "book_id": 1,
                "title": "Wiedźmin",
                "authors": ["Andrzej Sapkowski"],
                "publish_year": 1990,
                "isbn_number": "111",
                "length": 300,
                "language": "PL",
                "publisher": "Wydawnictwo Testowe",
                "keywords": [],
                "genre": [],
                "instances": [{"id": 2, "status": "reserved"}, {"id": 1, "status": "available"}]
            }], "totalPages": 1, "totalResults": 1
        })

        data = await fetchAdminCatalogRequest('', undefined, undefined, 2)
        expect(data, "Gdy użyje błędnej strony").to.deep.equal({result: [], totalPages: 1, totalResults: 0})

        setMockAuth('noauth')
        await expect(fetchAdminCatalogRequest(), "Gdy użytkownik niezalogowany").rejects.toThrow('Błąd pobierania katalogu: 401')

        // todo: that might be a problem, user can fetch Admin catalog
        // setMockAuth('user')
        // await expect(fetchAdminCatalogRequest(), "Gdy użytkownik nie ma uprawnień").rejects.toThrow('Błąd pobierania katalogu: 401')

        setMockAuth(false)
    })
    test('Test funkcji `fetchAdminBookRequest`', async () => {
        setMockAuth('admin')
        let data = await fetchAdminBookRequest(1);
        expect(data).to.deep.equal({
            "book_id": 1,
            "title": "Wiedźmin",
            "authors": ["Andrzej Sapkowski"],
            "publish_year": 1990,
            "isbn_number": "111",
            "publisher": "Wydawnictwo Testowe",
            "language": undefined,
            "length": undefined,
            "keywords": [],
            "genre": [],
            "instances": [{"id": 1, "status": "available"}, {"id": 2, "status": "reserved"}]
        })

        data = await fetchAdminBookRequest(2);
        expect(data).to.deep.equal({
            "book_id": 2,
            "title": "Testowanie Softu",
            "authors": ["Janusz Tester"],
            "publish_year": 2024,
            "isbn_number": "222",
            "publisher": "Wydawnictwo Testowe",
            "keywords": [],
            "genre": [],
            "language": undefined,
            "length": undefined,
            "instances": [{"id": 3, "status": "rented"}, {"id": 4, "status": "damaged"}, {
                "id": 5,
                "status": "available"
            }]
        })

        await expect(fetchUserBookRequest(3)).rejects.toThrow('Nie znaleziono książki')

        // todo: that might be a problem, user can fetch Admin catalog
        // setMockAuth('user')
        // await expect(fetchUserBookRequest(1)).rejects.toThrow('')

        setMockAuth(false)
    })
    test('Test funckji `fetchUserListRequest`', async () => {
        setMockAuth('admin')
        let data = await fetchUserListRequest();
        expect(data, "Domyślne wyszukanie").to.deep.equal({
            "result": [
            {
                "user_id": 1,
                "name": "Jan",
                "surname": "Kowalski",
                "email": "jan.kowalski@test.pl",
                "status": "user",
                "currently_rented": [],
                "currently_reserved": []
            },
            {
                "user_id": 3,
                "name": "Anna",
                "surname": "Nowak",
                "email": "anna.nowak@test.pl",
                "status": "blocked",
                "currently_rented": [],
                "currently_reserved": []
            },
            {
                "user_id": 2,
                "name": "Marek",
                "surname": "Testowy",
                "email": "marek@test.pl",
                "status": "user",
                "currently_rented": [],
                "currently_reserved": []
            }], "totalPages": 1, "totalResults": 3
        })
        data = await fetchUserListRequest("Ja");
        expect(data, "Przy filtrowaniu po tytule").to.deep.equal({
            "result": [{
                "user_id": 1,
                "name": "Jan",
                "surname": "Kowalski",
                "email": "jan.kowalski@test.pl",
                "status": "user",
                "currently_rented": [],
                "currently_reserved": []
            }], "totalPages": 1, "totalResults": 1
        })

        setMockAuth('noauth')
        await expect(fetchUserListRequest(), "Gdy użytkownik niezalogowany").rejects.toThrow("Odmowa dostępu, wymagany dostęp pracownika")

        setMockAuth('user')
        await expect(fetchUserListRequest(), "Gdy użytkownik nie ma uprawnień").rejects.toThrow("Odmowa dostępu, wymagany dostęp pracownika")

        setMockAuth(false)
    })
})