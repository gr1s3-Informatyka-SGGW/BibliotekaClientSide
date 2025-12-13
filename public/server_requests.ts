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
export function ResetPasswordRequest(email: string): RequestResponse{
  return { return_code: 0 }
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

// LoginMock
import { type User } from "./db_types";

export interface LoginResponse {
  user: User;
  token: string;
}

export function LoginRequest(email: string,
                             password: string): RequestResponse<LoginResponse> {
  // mock admin
  if (email === "admin@test.com" && password === "adminADMIN123!@#") {
    return {
      return_code: 0,
      fetched_data: {
        user: {
          type: "admin",
          name: "Admin",
          email,
        },
        token: "mock-admin-token",
      },
    };
  }

  // mock normal user
  if (email === "user@test.com" && password === "userUSER123!@#") {
    return {
      return_code: 0,
      fetched_data: {
        user: {
          type: "user",
          name: "User",
          email,
        },
        token: "mock-user-token",
      },
    };
  }

  // login failure
  return {
    return_code: 1,
    error_message: "Invalid credentials",
  };
}

// RegisterMock
export function RegisterRequest(firstName: string,
                                lastName: string,
                                email: string,
                                password: string,
                                cardNumber: string,
                                exp: string,
                                cvv: string): RequestResponse<null> {
  const existingEmails = ["admin@test.com", "user@test.com"];
  if (existingEmails.includes(email)) {
    return {
      return_code: 1,
      error_message: "Użytkownik o podanym adresie e-mail już istnieje.",
    };
  }

  console.log("REGISTER USER:", {
    firstName,
    lastName,
    email,
    password,
    cardNumber,
    exp,
    cvv,
  });

  return { return_code: 0 };
}