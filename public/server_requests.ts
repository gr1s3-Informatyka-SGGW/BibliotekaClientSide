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
class RequestError extends Error{
    /**
     * @constructor
     * @prop {cause} message - wiadomość błędu
     * @prop {string} cause - precyzuje powód błędu, np.: odmowa dostępu
     * @prop {number} code - kod błędu zwrócony przez serwer
     * */
    constructor(message: string, cause?: string, code?: number, ) {
        super(message, {cause: cause})

    }

}
// Login
export function loginRequest(email: string, password: string): Session{
    throw Error("Not implemented exception")
}
export function registerRequest(name:string, surname:string, email:string, password:string, card_info: CreditCardInfo): void{
    throw Error("Not implemented exception")
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
export function removeBookInstanceRequest(instance_id: number):void{
    throw Error("Not implemented exception")
}
export function markDamegedBookInstanceRequest(instance_id: number): void{
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
