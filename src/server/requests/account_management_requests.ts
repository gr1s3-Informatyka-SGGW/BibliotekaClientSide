/**
 * @file Moduł zapytań związanych z tworzeniem i zarządzaniem kontami użytkownika i administratora: logowanie, rejestracja, edycja danych
 */
import {
    AccessDeniedError,
    API_URL,
    authHeaders,
    InvalidRequestDataError,
    RequestError
} from "./connection.ts";
import type {Book, CreditCardInfo, Session} from "../server_types.ts";

/**
 * Wysyła zapytanie w celu weryfikacji logowania użytkownika
 * @param {string} email
 * @param {string} password
 * @returns {Session} token sesji w przypadku sukcesu
 *
 * @throws RequestError dla nieprzewidzianego błędu serwera przy tworzeniu użytkownika
 * @throws InvalidRequestDataError gdy dane nie spełniają wymagań
 * */
export async function loginRequest(email: string, password: string): Promise<Session>{
    const requestUrl = `${API_URL}/api/users/login`;
    const requestOptions = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({email, password})
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);

    return await fetch(requestUrl, requestOptions)
        .then(async (response) => {
            const data = await response.json();
            console.log('Response from:', requestUrl, 'Status:', response.status, 'Data:', data);

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

/**
 * Rejestruje nowego użytkownika w systemie.
 *
 * @param {string} name Imię użytkownika
 * @param {string} surname Nazwisko użytkownika
 * @param {string} email Adres email użytkownika
 * @param {string} password Hasło użytkownika
 * @param {CreditCardInfo} card_info Informacje o karcie płatniczej użytkownika (numer, data wygaśnięcia, CVV)
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy użytkownik o podanym adresie email już istnieje (kod 409)
 * @throws {RequestError} Gdy wystąpi nieoczekiwany błąd serwera
 */
export async function registerRequest(name:string, surname:string, email:string, password:string, card_info: CreditCardInfo): Promise<void>{
    const requestUrl = `${API_URL}/api/users/register`;
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            surname: surname,
            email: email,
            password: password,
            phone: '0',
            cardNumber: card_info.number,
            expirationDate: card_info.exp_date,
            cvv: card_info.cvv,
        })
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const response = await fetch(requestUrl, requestOptions);

    const data = await response.json();
    console.log('Response from:', requestUrl, 'Status:', response.status, 'Data:', data);


    if (response.status >= 200 && response.status < 300) { // success
        return;
    }

    if (response.status === 409) {
        throw new InvalidRequestDataError("Błąd rejestracji, Użytkownik o tym mailu już istnieje",
            true);
    }

    throw new RequestError(
        data?.error || "Nieoczekiwany błąd zapytania",
        undefined,
        response.status
    );

}


/**
 * Rejestruje nowego pracownika/admina.
 *
 * @param name Imię pracownika
 * @param surname Nazwisko pracownika
 * @param email Email pracownika
 * @param password Hasło pracownika
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy brakuje wymaganych danych
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy użytkownik już istnieje lub wystąpił błąd serwera
 */
export async function addAdminRequest(
    name: string,
    surname: string,
    email: string,
    password: string
): Promise<void> {
    if (!name || !surname || !email || !password) {
        throw new InvalidRequestDataError("Brak wymaganych danych", false);
    }

    const requestUrl = `${API_URL}/api/users/registerWorker`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({name, surname, email, password, phone: ''}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 400) {
        throw new InvalidRequestDataError("Nieprawidłowe dane rejestracji", false);
    }

    if (r.status === 409) {
        throw new RequestError("Użytkownik o podanym adresie email już istnieje");
    }

    if (!r.ok) {
        throw new RequestError("Błąd serwera podczas tworzenia użytkownika");
    }
}

export async function changeClientDataRequest(name: string, surname: string): Promise<void>{
    const requestUrl = `${API_URL}/api/users/editClientData`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            name: name,
            surname: surname
        }),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const response = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', response.status);

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
    const requestUrl = `${API_URL}/api/users/editClientCreditCard`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            number: number,
            cvv: cvv,
            expDate: exp_date
        }),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const response = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', response.status);

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

/**
 * Zmienia hasło użytkownika.
 *
 * @param {string} old_password Aktualne hasło użytkownika
 * @param {string} new_password Nowe hasło użytkownika
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError} Gdy brak tokenu użytkownika w localStorage
 * @throws {InvalidRequestDataError} Gdy stare hasło jest niepoprawne lub sesja wygasła (kod 400)
 * @throws {RequestError} Gdy wystąpi nieoczekiwany błąd serwera
 */
export async function changeClientPasswordRequest(old_password: string, new_password: string): Promise<void>{
    const requestUrl = `${API_URL}/api/users/newPassword`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            oldPassword: old_password,
            newPassword: new_password
        }),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const response = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', response.status);

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

/**
 * Usuwa użytkownika z systemu.
 *
 * @param {string} email Email użytkownika
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function removeUserRequest(email: string): Promise<void> {
    const requestUrl = `${API_URL}/api/users/deleteUser`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({email}),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        throw new RequestError("Błąd usuwania użytkownika");
    }
}
/**
 * Zmienia status blokady użytkownika.
 *
 * @param {number} userId Id użytkownika
 * @param {boolean} status true = zablokuj, false = odblokuj
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
// todo: nie ma wyznacznika wskazującego na to, że jesteś zablokowany.
export async function toggleUserBlockRequest(
    userId: number,
    status: boolean
): Promise<void> {
    if (!userId || userId <= 0) {
        throw new InvalidRequestDataError("Niepoprawne ID użytkownika", false);
    }

    const requestUrl = `${API_URL}/api/users/toggleBlock`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
            userId,
            status,
        }),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        if (r.status === 400) {
            throw new RequestError(
                "Nie można zmienić statusu blokady użytkownika"
            );
        }

        if (r.status === 403) {
            throw new AccessDeniedError("Brak uprawnień WORKER");
        }

        throw new RequestError("Błąd serwera");
    }
}

export async function blockUserRequest(userId: number): Promise<void> {
    return toggleUserBlockRequest(userId, true);
}

export async function unblockUserRequest(userId: number): Promise<void> {
    return toggleUserBlockRequest(userId, false);
}

