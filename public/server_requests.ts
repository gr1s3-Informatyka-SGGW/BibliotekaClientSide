/**
 * @file Plik zawierający funkcje obsługujące komunikację z bazą danych
 * */

import type {
    Book,
    BookAdmin,
    BookSearchFilter,
    SearchSort,
    BookUser,
    CreditCardInfo,
    Session,
    User, UserInfo, RentLogSearchFilter, UserListSearchFilter, RentFullInfo
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

export function registerRequest(name:string, surname:string, email:string, password:string, card_info: CreditCardInfo): void{
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
export function resetPasswordRequest(email: string): void{
    throw Error("Not implemented exception")
}

// ProfileView
export function fetchUserInfoRequest(): User{
    throw Error("Not implemented exception")
}

export function changeClientDataRequest(name: string, surname: string): void{
    throw Error("Not implemented exception")
}
export function changeClientCreditCardRequest({number, cvv, exp_date}: CreditCardInfo): void{
    throw Error("Not implemented exception")
}

export function changeClientPasswordRequest(old_password: string, new_password: string): void{
    throw Error("Not implemented exception")
}

export function cancelReservationRequest(reservation_id: number): void{
    throw Error("Not implemented exception")
}
export function claimReservationRequest(reservation_id: number): void{
    throw Error("Not implemented exception")
}

export function extendRentRequest(rent_id: number): void{
    throw Error("Not implemented exception")
}

export function returnBookRequest(rend_id: number): void{
    throw Error("Not implemented exception")
}


export function fetchBorrowedBooksRequest(): Book[]{
    throw Error("Not implemented exception")
}



// Katalog - User
export function fetchUserCatalogRequest(search_bar: string ,sort?: SearchSort, filter?: BookSearchFilter): BookUser[]{
    throw Error("Not implemented exception")
}
export function rentBookRequest(book_id: number): void{
    throw Error("Not implemented exception")
}
export function reserveBookRequest(book_id: number): void{
    throw Error("Not implemented exception")
}
// Katalog - Admin
export function fetchAdminCatalogRequest(search_bar?:string, sort?: SearchSort, filter?: BookSearchFilter): BookAdmin[]{
    throw Error("Not implemented exception")
}

export function editBookRequest(data: Book): void{
    throw Error("Not implemented exception")
}
export function removeBookRequest(book_id: number): void{
    throw Error("Not implemented exception")
}
export function removeBookInstanceRequest(instance_id: number):void{
    throw Error("Not implemented exception")
}
export function markDamagedBookInstanceRequest(instance_id: number): void{
    throw Error("Not implemented exception")
}
export function markMendedBookInstanceRequest(instance_id: number): void{
    throw Error("Not implemented exception")
}
export function addBookInstanceRequest(book_id: number): void{
    throw Error("Not implemented exception")
}
// Users
export function fetchUserListRequest(search_bar?: string, sort?: SearchSort, filter?: UserListSearchFilter): UserInfo[]{
    throw Error("Not implemented exception")
}
// Add Book View
export function addBookRequest(data: Book): void{
    throw Error("Not implemented exception")
}
// Rent log
export function fetchRentLog(search_bar?: string, sort?: SearchSort, filter?: RentLogSearchFilter): RentFullInfo{
    throw Error("Not implemented exception")
}
