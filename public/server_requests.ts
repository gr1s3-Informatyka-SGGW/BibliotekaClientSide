/**
 * @file Plik zawierający funkcje obsługujące komunikację z bazą danych
 * */

import type {Book} from "./server_types.ts";

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

// ProfileView
interface ProfileViewFetchResponse{
    user_info: {
        name: string,
        surname: string,
        email: string,
        card_number: string
    },
    rented_books: {
        id: number,
        title: string
        author: string[],
        return_date: Date
    }[],
    reserved_books: {
        id: number,
        title: string,
        author: string[],
        return_date: Date
    }[]
}

export function changeClientDataRequest(name: string, surname: string): void{
    throw Error("Not implemented exception")
}
export function changeClientCreditCardRequest(number: string, cvv: string, expDate: string): void{
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
export function rentBookRequest(rent_id: number): void{
    throw Error("Not implemented exception")
}
export function fetchLoginInfoRequest(): { name: string, surname: string, email: string, card_numbers: string }{
    throw Error("Not implemented exception")
}
export function fetchBorrowedBooksRequest(): Book[]{
    throw Error("Not implemented exception")
}


