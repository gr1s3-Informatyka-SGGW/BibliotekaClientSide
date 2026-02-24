/**
 * @file Obsługuje połączenie z API i jego autoryzacje.
 * Definiuje błędy zwracane przez zapytania.
 * */

/**
 * @var {string} API_URL - link do API pobrany z pliku .env
 * */
import type {Session} from "../server_types.ts";


export const API_URL =  import.meta.env.VITE_API_LINK || "";
if(API_URL === ""){
    console.error("Brak linku do API w pliku .env");
}
/**
 * Stała przełączająca między trybami autoryzacji na rzecz testów.
 * @note Działa wyłącznie gdy wczytana zostanie testowa baza danych, definiująca używanych użytkowników.
 * Gdy ustawione na `false` Funkcje `adminHeaders` i `authHeaders` działają normalnie.
 * Gdy stąła ustawiona na `'user'` lub `'admin'` zamiast zapisanych danych logowania, używane są predefiniowane tokeny o odpowiednich uprawnieniach.
 * Po ustawieniu zmiennej na 'noauth' zapytania będą traktowane jako dla osoby nie zalogowanej
 * */
var MOCK_AUTH: 'user'|'admin'| 'noauth'| false = false
/**
 * Funkcja zmieniająca wartość 'stałej' `MOCK_AUTH` na podany parametr. Używana przy testowaniu dostepu funkcji w różnych trybach
 * */
export function setMockAuth(mode: 'user'|'admin'| 'noauth'| false){
    MOCK_AUTH = mode;
}
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



/**
 * Tworzy nagłówki HTTP dla zapytań wymagających uprawnień administratora.
 * Pobiera token z localStorage i dodaje go do nagłówka Authorization.
 *
 * @returns {Object} Obiekt zawierający nagłówki HTTP z tokenem Bearer
 *
 * @throws {AccessDeniedError} Gdy token administratora nie został znaleziony w localStorage
 */
export function adminHeaders() : { "Content-Type": string, Authorization: string }{
    if (MOCK_AUTH === 'admin'){
        // todo: add admin token
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer `
        }
    }

    const session_str = localStorage.getItem("session");
    if(session_str == null){
        throw new AccessDeniedError("Brak tokenu administratora");
    }
    const session: Session = JSON.parse(session_str);
    if (!session?.token) {
        throw new AccessDeniedError("Brak tokenu administratora");
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
    };
}

/**
 * Tworzy nagłówki HTTP dla zapytań wymagających uwierzytelnienia użytkownika.
 * Pobiera token z localStorage i dodaje go do nagłówka Authorization.
 *
 * @returns {Object} Obiekt zawierający nagłówki HTTP z tokenem Bearer
 *
 * @throws {AccessDeniedError} Gdy token użytkownika nie został znaleziony w localStorage
 */
export function authHeaders(): { "Content-Type": string, Authorization: string } {
    if(MOCK_AUTH == 'user'){
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6IlVTRVIiLCJlbWFpbCI6InN6eW1vbi5jcmVkb0BnbWFpbC5jb20iLCJpYXQiOjE3NjkwNTA1MTgsImV4cCI6MTc2OTEzNjkxOH0.Nsyz_eFrVSs1y_NBsNLfYBafPvtyCzED3TYHajceRbc`
        }
    }
    if(MOCK_AUTH == 'noauth' || !localStorage){
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer `
        }
    }
    const session_str = localStorage.getItem("session");
    if(session_str == null){
        throw new AccessDeniedError("Brak tokenu użytkownika");
    }
    const session: Session = JSON.parse(session_str);
    if (!session?.token) {
        throw new AccessDeniedError("Brak tokenu użytkownika");
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
    };
}