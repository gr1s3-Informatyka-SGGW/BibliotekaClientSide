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

    return fetch('api/users/login', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({email, password})
    })
        .then(async (response) => {
            const data = await response.json();

            if(!response.ok){
                if(response.status === 400 || response.status === 401){
                    throw new InvalidRequestDataError(
                        "Logowanie nieudane",
                        false,
                        response.status === 401 ? "Błędne poświadczenie" : "Brakujące pola"
                    );
                }
                if(response.status === 500){
                    throw new InvalidRequestDataError(
                        "Serwer odrzucił żądanie",
                        true,
                        data.message || "Błąd wewnętrzny przy przetwarzaniu danych"
                    )
                }

                throw new RequestError(
                    "Nieoczekiwany błąd zapytania",
                    data.message,
                    response.status
                );
            }

            const session : Session = {
                token : data.token,
                access: data.user.role.toLowerCase() === 'worker' ? 'admin' : 'user',
                user: data.user
            };
            return session;
        }) as unknown as Session;
}

export async function registerRequest(name:string, surname:string, email:string, password:string, card_info: CreditCardInfo): Promise<void>{
    const response = await fetch("api/users/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            name: name,
            surname: surname,
            email: email,
            password: password,
            cardNumber: card_info.number,
            expirationDate: card_info.exp_date,
            cvv: card_info.cvv
        }),
    });

    const data = await response.json();

    if(response.status === 201){
        console.log("Rejestracja udana:", data.message);
        return;
    }

    if(response.status === 409){
        throw new InvalidRequestDataError("Błąd rejestracji",
            true
            ,"Użytkownik o tym mailu już istnieje");
    }
    throw new RequestError(response.status.toString());

}
export async function resetPasswordRequest(email: string): Promise<void>{
    const response = await fetch("/api/users/newPassword", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            email: email
        }),
    });

    if(response.status === 200){
        return;
    }

    if(response.status === 400){
        throw new InvalidRequestDataError(
            "Błąd resetowania",
            true,
            "Nie znaleziono użytkownika o podanym adresie email."
        );
    }
    throw new RequestError(response.status.toString());

}

// ProfileView
export async function fetchUserInfoRequest(): Promise<User>{
    const response = await fetch("/api/users/loginInfo", {
        method: "GET",
        headers:{
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
    });

    if(response.status === 200){
        return await response.json();
    }

    if(response.status === 400){
        throw new InvalidRequestDataError(
            "Błąd profilu",
            true,
            "Nie znaleziono użytkownika dla podanego tokenu."
        );
    }

    throw new RequestError(response.status.toString());
}

export async function changeClientDataRequest(name: string, surname: string): Promise<void>{
    const response= await fetch("/api/users/editClientData", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            name: name,
            surname: surname
        }),
    });

    if(response.status === 200){
        return;
    }

    if(response.status === 400){
        throw new InvalidRequestDataError(
            "Błąd edycji danych",
            true,
            "Nie znaleziono użytkownika dla podanego tokenu lub brak danych do zmiany."
        );
    }

    throw new RequestError(response.status.toString());
}
export async function changeClientCreditCardRequest({number, cvv, exp_date}: CreditCardInfo): Promise<void>{
    const response = await fetch("/api/users/editClientCreditCard", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            number: number,
            cvv: cvv,
            exp_date: exp_date
        }),
    });

    if(response.status === 200){
        return;
    }

    if(response.status === 400){
        throw new InvalidRequestDataError(
            "Błąd karty płatniczej",
            true,
            "Nie znaleziono użytkownika lub podano niepoprawne dane karty."
        );
    }

    throw new RequestError(response.status.toString());
}

export async function changeClientPasswordRequest(old_password: string, new_password: string): Promise<void>{
    const response = await fetch("/api/users/newPassword", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            old_password: old_password,
            new_password: new_password
        }),
    });

    if(response.status === 200){
        return;
    }

    if(response.status === 400){
        throw new InvalidRequestDataError(
            "Błąd zmiany hasła",
            true,
            "Stare hasło jest niepoprawne lub sesja wygasła."
        );
    }

    throw new RequestError(response.status.toString());
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
    const response = await fetch("/api/users/borrowedBooks", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
    });

    if(response.status === 200){
        const data = await response.json();
        return data as Book[];
    }

    if (response.status === 400) {
        throw new InvalidRequestDataError(
            "Błąd pobierania wypożyczeń",
            true,
            "Nie znaleziono użytkownika dla podanego tokenu."
        );
    }

    throw new RequestError(response.status.toString());
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
export async function fetchRentLog(search_bar?: string, sort?: SearchSort, filter?: RentLogSearchFilter): Promise<RentFullInfo[]>{
    throw Error("Not implemented exception")
}
