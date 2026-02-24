import { describe, test, expect } from 'vitest';
import {fetchFiltersRequest} from "../src/server/requests/fetch_requests";
import {setMockAuth} from "../src/server/requests/connection";
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
    })



})