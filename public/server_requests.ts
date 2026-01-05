/**
 * @file Plik zawierający funkcje obsługujące komunikację z bazą danych
 * */

import { SAMPLE_AUTHORS, SAMPLE_TAGS, SAMPLE_GENRES, SAMPLE_PUBLISHERS, SAMPLE_LANGUAGES, SAMPLE_BOOKS } from "./fake_catalog_data.ts";
import { wait, randDelay, matchesFilter, applySort, toBookUser, paginate } from "./fake_catalog_data.ts";

import type {
    Book,
    BookAdmin,
    BookSearchFilter,
    SearchSort,
    BookUser,
    CreditCardInfo,
    Session,
    User, UserInfo, RentLogSearchFilter, UserListSearchFilter, RentFullInfo,
    CatalogResponse
} from "./server_types.ts";

/**
 * Błędy zwracane przez funkcje zapytania w przypadku, gdy server zwrócił informacje o niepowodzeniu (kod 400 lub niektórych wypadkach 500)
 * @extends Error
 * */
export class RequestError extends Error{
    /**
     * @constructor
     * @prop {cause} message - wiadomość błędu
     * @prop {string|undefined} cause - precyzuje powód wystapienia błędu
     * @prop {number|undefined} code - kod błędu zwrócony przez serwer
     * */
    constructor(message: string, cause?: string, code?: number) {
        super(message, {cause: cause})

    }

}
/**
 * Błąd zwrócony, gdy serwer nie wykonał zapytania przez brak uprawnień użytkownika,
 * bądź token sesji nie zostanie znaleziony przy próbie realizacji zapytania go wymagającego
 * @extends RequestError
 * */
export class AccessDeniedError extends RequestError{
    constructor(message: string, cause?:string) {
        cause = cause == undefined ? "Odmowa dostępu" : "Odmowa dostepu:"+cause
        super(message, cause , 500);
    }
}
/**
 * Błąd zwracany, gdy dane podane w zapytaniu nie spełniają wymogów walidacji
 * lub serwer zwrócił kod 500 powołując się na błędne dane
 * @extends RequestError
 * */
export class InvalidRequestDataError extends RequestError{
    /**
     * @constructor
     * @param {string} message - wiadomość błędu
     * @param {boolean} isServerSide - precyzuje czy błąd wynika z walidacji po stronie użytkownika, czy serwera
     * @param {string|undefined} cause - sprecyzowanie powodu wystąpienia błędu
     * */
    constructor(message: string, isServerSide: boolean, cause?:string) {
        cause = cause == undefined ? "Niepoprawne dane" : "Niepoprawne dane:"+cause
        const code = isServerSide ? 500 : undefined
        super(message, cause , code);
    }
}
/**
 * Stosowany przy zapytaniach posiadających jednoznacznie zdefiniowany target poprzez id
 * w przypadku gdy obiekt o danym ID nie został odnaleziony przez bazę danych (kod 400)
 * */
export class TargetNotFoundError extends RequestError{
    constructor(message: string, cause?: string) {
        super(message, cause, 400);

    }

}

// Login page requests
/**
 * Wysyła zapytanie w celu weryfikacji logowania użytkownika
 * @param {string} email
 * @param {string} password
 * @returns {Session} token sesji w przypadku sukcesu
 *
 * @throws RequestError dla nieprzewidzianego błędu serwera przy tworzeniu użytkownika
 * @throws InvalidRequestDataError gdy dane nie spełniają wymagań
 * */
export function loginRequest(email: string, password: string): Session{
    // mock admin
    if (email === "admin@test.com" && password === "adminADMIN123!@#") {
        return {
            user: {
                name: "Admin",
                surname: "Adminowicz",
                email: email,
            },
            access: "admin",
            token: "mock-admin-token",
        };
    }

    // mock normal user
    if (email === "user@test.com" && password === "userUSER123!@#") {
        return {
            user: {
                name: "User",
                surname: "Userowicz",
                email: email
            },
            access: "user",
            token: "mock-user-token"
        }
    }

    // login failure
    throw new RequestError("Wystąpił nieprzewidziany błąd przy logowaniu")

}

export async function registerRequest(name:string, surname:string, email:string, password:string, card_info: CreditCardInfo): Promise<void>{
    const existingEmails = ["admin@test.com", "user@test.com"];
    if (existingEmails.includes(email)) {
        throw new InvalidRequestDataError("Podany adres email już istnieje w bazie danych", true);
    }

    console.log("REGISTER USER:", {
        name,
        surname,
        email,
        password,
        card_info
    });
}
export async function resetPasswordRequest(email: string): Promise<void>{
    throw Error("Not implemented exception")
}

// ProfileView
export async function fetchUserInfoRequest(): Promise<User>{
    throw Error("Not implemented exception")
}

export async function changeClientDataRequest(name: string, surname: string): Promise<void>{
    throw Error("Not implemented exception")
}
export async function changeClientCreditCardRequest({number, cvv, exp_date}: CreditCardInfo): Promise<void>{
    throw Error("Not implemented exception")
}

export async function changeClientPasswordRequest(old_password: string, new_password: string): Promise<void>{
    throw Error("Not implemented exception")
}

export async function cancelReservationRequest(reservation_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export async function claimReservationRequest(reservation_id: number): Promise<void>{
    throw Error("Not implemented exception")
}

export async function extendRentRequest(rent_id: number): Promise<void>{
    throw Error("Not implemented exception")
}

export async function returnBookRequest(rend_id: number): Promise<void>{
    throw Error("Not implemented exception")
}


export async function fetchBorrowedBooksRequest(): Promise<Book[]>{
    throw Error("Not implemented exception")
}

// Katalog - Ogólne

export async function fetchAuthorsRequest(): Promise<string[]>{
    await wait(randDelay());
    return SAMPLE_AUTHORS;
}

export async function fetchTagsRequest(): Promise<string[]>{
    await wait(randDelay());
    return SAMPLE_TAGS;
}

export async function fetchGenresRequest(): Promise<string[]>{
    await wait(randDelay());
    return SAMPLE_GENRES;
}

export async function  fetchPublishersRequest(): Promise<string[]>{
    await wait(randDelay());
    return SAMPLE_PUBLISHERS;
}

export async function fetchLanguagesRequest(): Promise<string[]>{
    await wait(randDelay());
    return SAMPLE_LANGUAGES;
}
// Katalog - User
export async function fetchUserCatalogRequest(
    search: string,
    sort?: SearchSort,
    filter?: BookSearchFilter,
    page: number = 1
): Promise<CatalogResponse<BookUser>>{
    await wait(randDelay());

    let results = SAMPLE_BOOKS.filter(b => matchesFilter(b, search, filter));
    results = applySort(results, sort);

    const { items, totalPages } = paginate(results, page, 10);
    const totalBooks = results.length;
    const userBooks = (items as BookAdmin[]).map(toBookUser);
    return { books: userBooks, totalPages, totalBooks };
}

export async function rentBookRequest(book_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export async function reserveBookRequest(book_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export const fetchUserBookRequest = async (book_id: number): Promise<BookUser> => {
    return toBookUser(await fetchAdminBookRequest(book_id));
}
// Katalog - Admin
export const fetchAdminCatalogRequest = async (
    search: string,
    sort?: SearchSort,
    filter?: BookSearchFilter,
    page: number = 1
): Promise<CatalogResponse<BookAdmin>> => {
    await wait(randDelay());

    let results = SAMPLE_BOOKS.filter(b => matchesFilter(b, search, filter));
    results = applySort(results, sort);

    const { items, totalPages } = paginate(results, page, 10);
    const totalBooks = results.length;
    return { books: items as BookAdmin[], totalPages, totalBooks };
};
export const fetchAdminBookRequest = async (book_id: number): Promise<BookAdmin> => {
    const bookAdmin = SAMPLE_BOOKS.find((b: BookAdmin) => b.book_id === book_id);
    if (!bookAdmin) { throw `Nie znaleziono książki o book_id = ${book_id}` }
    return bookAdmin;
}

export async function editBookRequest(book:Book){
    const r = await fetch("/api/book/update", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(book)
    })
    if (!r.ok) throw Error()
}
export async function removeBookRequest(book_id: number): Promise<void> {
    const index = SAMPLE_BOOKS.findIndex(book => book.book_id === book_id);

    if (index !== -1) {
        SAMPLE_BOOKS.splice(index, 1);
    }
}
export async function removeBookInstanceRequest(instance_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export async function markDamagedBookInstanceRequest(instance_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export async function markMendedBookInstanceRequest(instance_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
let mockInstanceCounter = 1;
export async function addBookInstanceRequest(book_id: number): Promise<{ instance_id: number }> {
    if (USE_MOCK) {
        const fakeId = mockInstanceCounter++;
        console.log("MOCK addBookInstanceRequest:", book_id, "->", fakeId);

        return {
            instance_id: fakeId
        };
    }
    const r = await fetch("/api/book-instance/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id })
    });

    if (!r.ok) throw Error();
    return await r.json();
}
// Users
export async function fetchUserListRequest(search_bar?: string, sort?: SearchSort, filter?: UserListSearchFilter): Promise<UserInfo[]>{
    throw Error("Not implemented exception")
}
export async function removeUserRequest(user_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export async function blockUserRequest(user_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export async function unblockUserRequest(user_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export async function addAdminRequest(admin_info: User): Promise<void>{
    throw Error("Not implemented exception")
}

// Add Book View
const USE_MOCK = true;
export async function addBookRequest(book: Book): Promise<{ book_id: number }> {
    if (USE_MOCK) {
        return { book_id: Date.now() };
    }
    const r = await fetch("/api/book/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book)
    });

    if (!r.ok) throw Error();

    return await r.json();
}
// Rent log
export async function fetchRentLog(search_bar?: string, sort?: SearchSort, filter?: RentLogSearchFilter): Promise<RentFullInfo>{
    throw Error("Not implemented exception")
}
