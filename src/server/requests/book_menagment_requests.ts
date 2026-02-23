/** @file Moduł funkcji związanych z zarządzaniem książką i jej egzemplarzami: dodawaniem, edycją i zmianami statusu
 * */

import {adminHeaders, API_URL, InvalidRequestDataError, RequestError, TargetNotFoundError} from "./connection.ts";
import type {Book} from "../server_types.ts";

/**
 * Dodaje nową książkę.
 *
 * @param {Book} book Dane książki
 * @param {number} instance_number ilość egzemplarzy tworzonych przy tej okazji
 *
 * @returns {Promise<{ book_id: number, instance_ids: number[] }>} id książki i id egzemplarzy dodanych do bazy danych
 *
 * @throws {AccessDeniedError} Brak tokenu lub uprawnień
 * @throws {InvalidRequestDataError} Niepoprawne dane wejściowe (400)
 * @throws {RequestError} Błąd serwera (500), serwer odmówił odpowiedzi
 */
// todo: zmieniłem sygnaturę i zawartość tej funkcji, upewnić się czym działa i uwzględnić w testach itp.
export async function addBookRequest(
    book: Book,
    instance_number: number
): Promise<{ book_id: number; instance_ids: number[] }> {
    const requestUrl = `${API_URL}/api/books/addBook`;
    const requestOptions = {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({
            ...book,
            ilosc_egzemplarzy: instance_number,
        }),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 400) {
        throw new InvalidRequestDataError("Niepoprawne dane wejściowe", true);
    }

    if (!r.ok) {
        throw new RequestError("Błąd serwera", "Serwer odmówił odpowiedzi", 500);
    }

    const data = await r.json();
    console.log('Response data:', data);

    return {
        book_id: data.Bookid,
        instance_ids: data.Copyids,
    };
}

/**
 * Usuwa książkę z systemu.
 *
 * @param {number} book_id Identyfikator książki
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy nie podano id książki
 * @throws {TargetNotFoundError} Gdy książka nie istnieje
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function removeBookRequest(book_id: number): Promise<void> {
    if (!book_id) {
        throw new InvalidRequestDataError("Brak id książki", false);
    }

    const requestUrl = `${API_URL}/api/books/delete`;
    const requestOptions = {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({id_ksiazki: book_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 400) {
        throw new TargetNotFoundError("Nie znaleziono książki");
    }
    if (!r.ok) {
        throw new RequestError("Błąd usuwania książki");
    }
}

/**
 * Edytuje dane istniejącej książki.
 *
 * @param {Book} book Zaktualizowane dane książki
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy brak id książki lub dane są niepoprawne
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function editBookRequest(book: Book): Promise<void> {
    if (!book?.book_id) {
        throw new InvalidRequestDataError("Brak id książki", false);
    }

    const requestUrl = `${API_URL}/api/books/edit`;
    const requestOptions = {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify(book),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 400) {
        throw new InvalidRequestDataError("Nie można edytować książki", true);
    }
    if (!r.ok) {
        throw new RequestError("Błąd edycji książki");
    }
}

/**
 * Dodaje nowy egzemplarz książki.
 *
 * @param {number} book_id Id książki
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function addBookInstanceRequest(book_id: number): Promise<void> {
    if (book_id <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID książki", false);
    }

    const requestUrl = `${API_URL}/api/books/addCopy`;
    const requestOptions = {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({book_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        throw new RequestError("Błąd dodawania egzemplarza");
    }
}
/**
 * Usuwa egzemplarz książki z systemu.
 *
 * @param {number} instance_id Identyfikator egzemplarza
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy nie podano id egzemplarza
 * @throws {TargetNotFoundError} Gdy egzemplarz nie istnieje
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function removeBookInstanceRequest(instance_id: number): Promise<void> {
    if (!instance_id) {
        throw new InvalidRequestDataError("Brak id egzemplarza", false);
    }

    const requestUrl = `${API_URL}/api/copies/delete`;
    const requestOptions = {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({id_egzemplarza: instance_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 400) {
        throw new TargetNotFoundError("Nie znaleziono egzemplarza");
    }
    if (!r.ok) {
        throw new RequestError("Błąd usuwania egzemplarza");
    }
}

/**
 * Oznacza egzemplarz książki jako niezniszczony.
 *
 * @param {number} instance_id Identyfikator egzemplarza
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy nie podano id egzemplarza
 * @throws {TargetNotFoundError} Gdy egzemplarz nie istnieje
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function markMendedBookInstanceRequest(
    instance_id: number
): Promise<void> {
    if (!instance_id) {
        throw new InvalidRequestDataError("Brak id egzemplarza", false);
    }

    const requestUrl = `${API_URL}/api/copies/markUndestroyed`;
    const requestOptions = {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({id_egzemplarza: instance_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 400) {
        throw new TargetNotFoundError("Nie znaleziono egzemplarza");
    }
    if (!r.ok) {
        throw new RequestError("Błąd oznaczania egzemplarza jako niezniszczony");
    }
}

/**
 * Oznacza egzemplarz książki jako zniszczony.
 *
 * @param {number} instance_id Identyfikator egzemplarza
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy nie podano id egzemplarza
 * @throws {TargetNotFoundError} Gdy egzemplarz nie istnieje
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function markDamagedBookInstanceRequest(instance_id: number): Promise<void> {
    if (!instance_id) {
        throw new InvalidRequestDataError("Brak id egzemplarza", false);
    }

    const requestUrl = `${API_URL}/api/books/copies/markDestroyed`;
    const requestOptions = {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({id_egzemplarza: instance_id}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 400) {
        throw new TargetNotFoundError("Nie znaleziono egzemplarza");
    }
    if (!r.ok) {
        throw new RequestError("Błąd oznaczania egzemplarza jako zniszczony");
    }
}