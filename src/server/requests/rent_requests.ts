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

    if (r.status > 400 && r.status < 500) {
        throw new RequestError(
            "Nie można wypożyczyć książki (brak dostępnych egzemplarzy lub już wypożyczona)"
        );
    }

    if (!r.ok) {
        throw new RequestError("Błąd wypożyczenia książki: " + r.statusText);
    }
}

/**
 * Przedłuża wypożyczenie książki.
 *
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 * @param instance_id
 */
export async function extendRentRequest(instance_id: number): Promise<void> {
    if (instance_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID wypożyczenia", false);
    }

    const requestUrl = `${API_URL}/api/books/extendRent`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({Copyid: instance_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        if( r.status === 400)
            throw new RequestError("Błąd przedłużenia: wypożyczenie nie istnieje")
        if(r.status === 401)
            throw new RequestError("Błąd przedłużenia: dana książka nie jest wypożyczona przez użytkownika zlecającego przedłużenie")
        throw new RequestError("Nieprzewidzany błąd przedłużania wypożyczenia");
    }
}

/**
 * Zwraca wypożyczoną książkę.
 *
 * @param {number} instance_id Id zwracanej kopii
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function returnBookRequest(instance_id: number): Promise<void> {
    if (instance_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID wypożyczenia", false);
    }

    const requestUrl = `${API_URL}/api/books/returnBook`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({Copyid: instance_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        if( r.status === 400)
            throw new RequestError('Błąd przy zwrocie książki: nie znaleziono wypożyczenia')
        if(r.status === 403)
            throw new RequestError('Błąd przy zwrocie książki: dana książka nie jest wypożyczona przez zwracającego użytkownika')
        throw new RequestError("Nieznany błąd zwrotu książki");
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
        body: JSON.stringify({Bookid: book_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        if( r.status === 400)
            throw new RequestError("Błąd przy rezerwacji książki: Brak dostępnych egzemplarza do zarezerwowania")
        throw new RequestError("Nieprzewidzany błąd rezerwacji książki");
    }
}

/**
 * Odbiera zarezerwowaną książkę.
 *
 * @param {number} instance_id Id zarezerwowanego egzemplarza
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError} gdy token użytkownika nie został odnaleziony, lub nie posiada niezbędnych uprawnień
 * @throws {InvalidRequestDataError} Gdy id rezerwacji jest niepoprawne
 * @throws {RequestError} niespodziewany błąd serwera
 */
export async function claimReservationRequest(
    instance_id: number
): Promise<void> {
    if (instance_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID rezerwacji", false);
    }

    const requestUrl = `${API_URL}/api/books/takeBook`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({Copyid: instance_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        if( r.status === 400)
            throw new RequestError('Błąd przy odbieraniu książki: książka nie jest zarezerwowana lub egzemplarz o tym numerze nie istnieje')
        if(r.status === 403)
            throw new RequestError('Błąd przy odbieraniu książki: dana książka nie jest zarezerwowana przez odbierającego użytkownika')
        throw new RequestError("Nieprzewidziany błąd odbioru rezerwacji");
    }
}
/**
 * Anuluje rezerwację książki.
 *
 * @param instance_id
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError} gdy token użytkownika nie został odnaleziony, lub nie posiada niezbędnych uprawnień
 * @throws {InvalidRequestDataError} Gdy id rezerwacji jest niepoprawne
 * @throws {RequestError} niespodziewany błąd serwera
 */
export async function cancelReservationRequest(
    instance_id: number
): Promise<void> {
    if (instance_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID rezerwacji", false);
    }

    const requestUrl = `${API_URL}/api/books/cancelReservation`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({Copyid: instance_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        if( r.status === 400)
            throw new RequestError("Błąd przy anulowaniu rezerwacji: podany egzemplarz nie jest zarezerwowany lub nie istnieje")
        if(r.status === 403)
            throw new RequestError("Błąd przy anulowaniu rezerwacji: podany egzemplarz nie jest zarezewowany przez tego użytkownika")
        throw new RequestError("Nieprzewidziany błąd anulowania rezerwacji");
    }
}