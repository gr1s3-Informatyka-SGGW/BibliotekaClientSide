/**
 * @file Moduł funkcji związanych z rezerwacjami i wypożyczaniami książek. Obsługuje zapytania wypożyczania, rezerwacji, przedłużania wypożyczenia i odbioru
 * */


import {API_URL, authHeaders, InvalidRequestDataError, RequestError} from "./connection.ts";

/**
 * Wypożycza książkę.
 *
 * @param {number} instance_id Id egzemplarza do wypożyczenia
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError} Gdy brak tokenu użytkownika
 * @throws {InvalidRequestDataError} Gdy id książki jest niepoprawne
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
// todo: check
export async function rentBookRequest(instance_id: number): Promise<void> {
    if (instance_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID egzemplarza", false);
    }

    const requestUrl = `${API_URL}/api/books/rentBook`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            Copyid: instance_id,
        }),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 400) {
        throw new RequestError(
            "Nie można wypożyczyć książki (brak dostępnych egzemplarzy lub już wypożyczona)"
        );
    }

    if (!r.ok) {
        throw new RequestError("Błąd wypożyczenia książki");
    }
}

/**
 * Przedłuża wypożyczenie książki.
 *
 * @param {number} rent_id Id wypożyczenia
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function extendRentRequest(rent_id: number): Promise<void> {
    if (rent_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID wypożyczenia", false);
    }

    const requestUrl = `${API_URL}/api/books/extendRent`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({rent_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        throw new RequestError("Błąd przedłużania wypożyczenia");
    }
}

/**
 * Zwraca wypożyczoną książkę.
 *
 * @param {number} rent_id Id wypożyczenia
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function returnBookRequest(rent_id: number): Promise<void> {
    if (rent_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID wypożyczenia", false);
    }

    const requestUrl = `${API_URL}/api/books/returnBook`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({rent_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        throw new RequestError("Błąd zwrotu książki");
    }
}

/**
 * Rezerwuje książkę.
 *
 * @param {number} book_id Id książki
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function reserveBookRequest(book_id: number): Promise<void> {
    if (book_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID książki", false);
    }

    const requestUrl = `${API_URL}/api/books/reserveBook`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({book_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        throw new RequestError("Błąd rezerwacji książki");
    }
}

/**
 * Odbiera zarezerwowaną książkę.
 *
 * @param {number} reservation_id Id rezerwacji
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError} gdy token użytkownika nie został odnaleziony, lub nie posiada niezbędnych uprawnień
 * @throws {InvalidRequestDataError} Gdy id rezerwacji jest niepoprawne
 * @throws {RequestError} niespodziewany błąd serwera
 */
export async function claimReservationRequest(
    reservation_id: number
): Promise<void> {
    if (reservation_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID rezerwacji", false);
    }

    const requestUrl = `${API_URL}/api/books/takeBook`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({reservation_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        throw new RequestError("Błąd odbioru rezerwacji");
    }
}
/**
 * Anuluje rezerwację książki.
 *
 * @param {number} reservation_id Id rezerwacji
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError} gdy token użytkownika nie został odnaleziony, lub nie posiada niezbędnych uprawnień
 * @throws {InvalidRequestDataError} Gdy id rezerwacji jest niepoprawne
 * @throws {RequestError} niespodziewany błąd serwera
 */
export async function cancelReservationRequest(
    reservation_id: number
): Promise<void> {
    if (reservation_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID rezerwacji", false);
    }

    const requestUrl = `${API_URL}/api/books/cancelReservation`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({reservation_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        throw new RequestError("Błąd anulowania rezerwacji");
    }
}