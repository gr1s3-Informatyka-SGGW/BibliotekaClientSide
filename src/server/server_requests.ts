/**
 * @file Plik zawierający funkcje obsługujące komunikację z bazą danych
 * @author Szymon Doba i Dawid Filipek
 * */

import type {
    Book,
    BookAdmin,
    BookSearchFilter,
    SearchSort,
    BookUser,
    CreditCardInfo,
    Session,
    User, UserInfo, RentLogSearchFilter, UserListSearchFilter, RentFullInfo,
    PagedResponse, Rent, Reservation
} from "./server_types.ts";

/**
 * @var {string} API_URL - link do API pobrany z pliku .env
 * */

const API_URL =  import.meta.env.VITE_API_LINK || "";

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
function adminHeaders() : { "Content-Type": string, Authorization: string }{
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
function authHeaders(): { "Content-Type": string, Authorization: string } {
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
export async function loginRequest(email: string, password: string): Promise<Session>{

    return await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
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
    console.log(`${API_URL}/api/users/register`, {
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
        })});
    const response = await fetch(`${API_URL}/api/users/register`, {
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
        })});

        const data = await response.json();;


        if (response.status === 201) {
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

    const r = await fetch(`${API_URL}/api/users/registerWorker`, {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ name, surname, email, password }),
    });

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
// ProfileView
export async function fetchUserInfoRequest(): Promise<User>{
    const response = await fetch(`${API_URL}/api/users/loginInfo`, {
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
    const response = await fetch(`${API_URL}/api/users/editClientData`, {
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
    const response = await fetch(`${API_URL}/api/users/editClientCreditCard`, {
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
    const response = await fetch(`${API_URL}/api/users/newPassword`, {
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


/**
 * Pobiera listę wypożyczonych książek dla zalogowanego użytkownika wraz ze szczegółowymi informacjami o każdej książce.
 *
 * @returns {Promise<Rent[]>} Lista wypożyczonych książek z dodatkowymi informacjami
 *
 * @throws {AccessDeniedError} Gdy brak tokenu użytkownika
 * @throws {InvalidRequestDataError} Gdy nie znaleziono użytkownika dla podanego tokenu
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchBorrowedBooksRequest(): Promise<Rent[]> {
    const response = await fetch(`${API_URL}/api/users/borrowedBooks`, {
        method: "GET",
        headers: authHeaders()
    });

    if (response.status === 400) {
        throw new InvalidRequestDataError(
            "Błąd pobierania wypożyczeń",
            true,
            "Nie znaleziono użytkownika dla podanego tokenu."
        );
    }

    if (response.status !== 200) {
        throw new RequestError(response.status.toString());
    }

    const data = await response.json();

    await data.map(async (item: {
        Bookid: number,
        tytul: string,
        autor: string,
        dataWypozyczenia : string,
        ilosc_przedluzen: number
    }): Promise<Rent> => {
               // oblicz datę zwrotu
        // data wypożyczenia + 30 + 30 * ilość przedłużeń
        const baseDate = new Date(item.dataWypozyczenia );
        const extensions = item.ilosc_przedluzen || 0;
        const finalReturnDate = new Date(baseDate);
        finalReturnDate.setDate(finalReturnDate.getDate() + (extensions * 30));

        // Pobierz dodatkowe informacje o książce
        let bookDetails: BookUser | null = null;
        try {
            bookDetails = await fetchUserBookRequest(item.Bookid);
        } catch (error: any) {
            throw new RequestError(`Nie udało się pobrać szczegółów książki ${item.Bookid}: ${error.message}`);
        }

        return {
            book: bookDetails,
            borrow_date: baseDate,
            return_date: finalReturnDate,
        }
    });
    return data;
}
// todo: sprawdzic
/**
 * Pobiera listę zarezerwowanych książek aktualnie zalogowanego użytkownika.
 *
 * @returns {Promise<Reservation[]>} Lista rezerwacji użytkownika (może być pusta)
 *
 * @throws {AccessDeniedError} Gdy brak tokenu użytkownika
 * @throws {TargetNotFoundError} Gdy nie znaleziono użytkownika dla tokenu
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchReservedBooksRequest(): Promise<Reservation[]> {
  const r = await fetch(`${API_URL}/api/users/reservedBooks`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (r.status === 400) {
    throw new TargetNotFoundError("Nie znaleziono użytkownika dla tokenu");
  }

  if (!r.ok) {
    throw new RequestError("Błąd pobierania zarezerwowanych książek");
  }

  const data = await r.json();

  return data.map((item: any) => ({
    book: {
      book_id: item.Bookid,
      title: item.tytul,
      authors: [item.autor],

      publish_year: 0,
      isbn_number: "",
      length: 0,
      language: "",
      publisher: "",
      keywords: [],
      genre: [],
    },
    reserve_to: item.termin_zwrotu,
  }));
}

/**
 * Anuluje rezerwację książki.
 *
 * @param {number} reservation_id Id rezerwacji
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError} gdy token użytkownika nie został odnaleziony, lub nie posiada niezbędnych uprawnień
 * @throws {InvalidRequestDataError} Gdy id rezerwacji jest niepoprawne
 * @throws {RequestError} niespodziewany błąd serwera
 */
export async function cancelReservationRequest(
  reservation_id: number
): Promise<void> {
  if (reservation_id <= 0) {
    throw new InvalidRequestDataError("Niepoprawne ID rezerwacji", false);
  }

    const r = await fetch(`${API_URL}/api/books/cancelReservation`, {
        method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reservation_id }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd anulowania rezerwacji");
  }
}

/**
 * Odbiera zarezerwowaną książkę.
 *
 * @param {number} reservation_id Id rezerwacji
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError} gdy token użytkownika nie został odnaleziony, lub nie posiada niezbędnych uprawnień
 * @throws {InvalidRequestDataError} Gdy id rezerwacji jest niepoprawne
 * @throws {RequestError} niespodziewany błąd serwera
 */
export async function claimReservationRequest(
  reservation_id: number
): Promise<void> {
  if (reservation_id <= 0) {
    throw new InvalidRequestDataError("Niepoprawne ID rezerwacji", false);
  }

    const r = await fetch(`${API_URL}/api/books/takeBook`, {
        method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ reservation_id }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd odbioru rezerwacji");
  }
}

/**
 * Przedłuża wypożyczenie książki.
 *
 * @param {number} rent_id Id wypożyczenia
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function extendRentRequest(rent_id: number): Promise<void> {
  if (rent_id <= 0) {
    throw new InvalidRequestDataError("Niepoprawne ID wypożyczenia", false);
  }

    const r = await fetch(`${API_URL}/api/books/extendRent`, {
        method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ rent_id }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd przedłużania wypożyczenia");
  }
}

/**
 * Zwraca wypożyczoną książkę.
 *
 * @param {number} rent_id Id wypożyczenia
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function returnBookRequest(rent_id: number): Promise<void> {
  if (rent_id <= 0) {
    throw new InvalidRequestDataError("Niepoprawne ID wypożyczenia", false);
  }

    const r = await fetch(`${API_URL}/api/books/returnBook`, {
        method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ rent_id }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd zwrotu książki");
  }
}


// Katalog - Ogólne

/**
 * Pobiera listę autorów dostępnych w systemie.
 *
 * @returns {Promise<string[]>} Lista autorów
 *
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchAuthorsRequest(): Promise<string[]> {
    const r = await fetch(`${API_URL}/api/books/authors`, {
        headers: authHeaders(),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania autorów");
  }

  return await r.json();
}
// todo: filtry są innym requestem
/**
 * Pobiera listę tagów książek.
 *
 * @returns {Promise<string[]>} Lista tagów
 *
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchTagsRequest(): Promise<string[]> {
    const r = await fetch(`${API_URL}/api/books/tags`, {
        headers: authHeaders(),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania tagów");
  }

  return await r.json();
}

/**
 * Pobiera listę gatunków książek.
 *
 * @returns {Promise<string[]>} Lista gatunków
 *
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchGenresRequest(): Promise<string[]> {
    const r = await fetch(`${API_URL}/api/books/genres`, {
        headers: authHeaders(),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania gatunków");
  }

  return await r.json();
}

/**
 * Pobiera listę wydawców.
 *
 * @returns {Promise<string[]>} Lista wydawców
 *
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchPublishersRequest(): Promise<string[]> {
    const r = await fetch(`${API_URL}/api/books/publishers`, {
        headers: authHeaders(),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania wydawców");
  }

  return await r.json();
}

/**
 * Pobiera listę języków.
 *
 * @returns {Promise<string[]>} Lista języków
 *
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchLanguagesRequest(): Promise<string[]> {
    const r = await fetch(`${API_URL}/api/books/languages`, {
        headers: authHeaders(),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania języków");
  }

  return await r.json();
}

// Katalog - User
/**
 * Pobiera katalog książek dla użytkownika.
 *
 * @param {string} search Fragment tytułu
 * @param {SearchSort} [sort] Informacje o sortowaniu
 * @param {BookSearchFilter} [filter] Filtry wyszukiwania
 * @param {number} [page=1] Numer strony
 *
 * @returns {Promise<PagedResponse<BookUser>>} Stronicowany katalog książek
 *
 * @throws {AccessDeniedError} Gdy brak tokenu użytkownika
 * @throws {InvalidRequestDataError} Gdy numer strony jest niepoprawny
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchUserCatalogRequest(
  search: string,
  sort?: SearchSort,
  filter?: BookSearchFilter,
  page: number = 1
): Promise<PagedResponse<BookUser>> {

  if (page < 1) {
    throw new InvalidRequestDataError("Numer strony musi być >= 1", false);
  }

    const r = await fetch(`${API_URL}/api/books/search`, {
        method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ search, sort, filter, page }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania katalogu");
  }

  return await r.json();
}

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
// todo: check
export async function rentBookRequest(instance_id: number): Promise<void> {
  if (instance_id <= 0) {
    throw new InvalidRequestDataError("Niepoprawne ID egzemplarza", false);
  }

  const r = await fetch(`${API_URL}/api/books/rentBook`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      Copyid: instance_id,
    }),
  });

  if (r.status === 400) {
    throw new RequestError(
      "Nie można wypożyczyć książki (brak dostępnych egzemplarzy lub już wypożyczona)"
    );
  }

  if (!r.ok) {
    throw new RequestError("Błąd wypożyczenia książki");
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

    const r = await fetch(`${API_URL}/api/books/reserveBook`, {
        method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ book_id }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd rezerwacji książki");
  }
}

/**
 * Pobiera szczegóły książki dla użytkownika.
 *
 * @param {number} book_id Identyfikator książki
 *
 * @returns {Promise<BookUser>} Dane książki
 *
 * @throws {AccessDeniedError}
 * @throws {TargetNotFoundError} Gdy książka nie istnieje
 * @throws {RequestError}
 */
export async function fetchUserBookRequest(book_id: number): Promise<BookUser> {
  const r = await fetch(`${API_URL}/api/books/${book_id}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!r.ok) {
    if (r.status === 400) {
      throw new TargetNotFoundError("Nie znaleziono książki");
    }
    throw new RequestError("Błąd pobierania książki");
  }

  return await r.json();
}

// Katalog - Admin
/**
 * Pobiera katalog książek dla widoku administratora z paginacją i filtrami.
 *
 * @param {string} [search_bar] fragment tytułu, wpisany w panel wyszukiwania
 * @param {SearchSort} [sort] Sortowanie wyników
 * @param {BookSearchFilter} [filter] Filtry wyszukiwania
 * @param {number} [page = 1] Numer strony
 *
 * @returns {Promise<PagedResponse<BookAdmin>>}
 *
 * @throws {InvalidRequestDataError} Gdy podano niepoprawne dane zapytania
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
// todo: search panel nie był uwzględniony i kolejność w sygnaturze uległa zmianie
export async function fetchAdminCatalogRequest(
    search_bar?: string,
    sort?: SearchSort,
    filter?: BookSearchFilter,
    page: number = 1
): Promise<PagedResponse<BookAdmin>> {
  if (page <= 0) {
    throw new InvalidRequestDataError(
      "Niepoprawne dane paginacji",
      false
    );
  }

    const r = await fetch(`${API_URL}/api/books/search`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      page,
      filter,
      sort,
    }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania katalogu administratora");
  }

  return (await r.json()) as PagedResponse<BookAdmin>;
}

/**
 * Pobiera szczegółowe informacje o książce dla pracownika.
 *
 * @param {number} book_id Identyfikator książki
 *
 * @returns {Promise<BookAdmin>} Dane książki wraz z egzemplarzami i rezerwacjami
 *
 * @throws {InvalidRequestDataError} Gdy nie podano id książki
 * @throws {TargetNotFoundError} Gdy książka nie istnieje
 * @throws {AccessDeniedError} Gdy brak tokenu pracownika
 * @throws {RequestError} Gdy wystąpił inny błąd serwera
 */
export async function fetchAdminBookRequest(
  book_id: number
): Promise<BookAdmin> {
  if (!book_id) {
    throw new InvalidRequestDataError("Brak id książki", false);
  }

  const r = await fetch(`${API_URL}/api/books/workerbook/${book_id}`, {
    method: "GET",
    headers: adminHeaders(),
  });

  if (r.status === 403) {
    throw new AccessDeniedError("Brak uprawnień do pobrania książki");
  }

  if (r.status === 404) {
    throw new TargetNotFoundError("Nie znaleziono książki");
  }

  if (!r.ok) {
    throw new RequestError("Błąd pobierania danych książki");
  }

  return (await r.json()) as BookAdmin;
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

    const r = await fetch(`${API_URL}/api/books/edit`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(book),
  });

  if (r.status === 400) {
    throw new InvalidRequestDataError("Nie można edytować książki", true);
  }
  if (!r.ok) {
    throw new RequestError("Błąd edycji książki");
  }
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

    const r = await fetch(`${API_URL}/api/books/delete`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id_ksiazki: book_id }),
  });

  if (r.status === 400) {
    throw new TargetNotFoundError("Nie znaleziono książki");
  }
  if (!r.ok) {
    throw new RequestError("Błąd usuwania książki");
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

    const r = await fetch(`${API_URL}/api/copies/delete`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id_egzemplarza: instance_id }),
  });

  if (r.status === 400) {
    throw new TargetNotFoundError("Nie znaleziono egzemplarza");
  }
  if (!r.ok) {
    throw new RequestError("Błąd usuwania egzemplarza");
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

    const r = await fetch(`${API_URL}/api/books/copies/markDestroyed`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id_egzemplarza: instance_id }),
  });

  if (r.status === 400) {
    throw new TargetNotFoundError("Nie znaleziono egzemplarza");
  }
  if (!r.ok) {
    throw new RequestError("Błąd oznaczania egzemplarza jako zniszczony");
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

    const r = await fetch(`${API_URL}/api/copies/markUndestroyed`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id_egzemplarza: instance_id }),
  });

  if (r.status === 400) {
    throw new TargetNotFoundError("Nie znaleziono egzemplarza");
  }
  if (!r.ok) {
    throw new RequestError("Błąd oznaczania egzemplarza jako niezniszczony");
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

    const r = await fetch(`${API_URL}/api/books/addCopy`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ book_id }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd dodawania egzemplarza");
  }
}

// Users
/**
 * Pobiera listę użytkowników dla administratora.
 *
 * @param {string} search_bar
 * @param {SearchSort} [sort] Sortowanie
 * @param {UserListSearchFilter} [filter] Filtry wyszukiwania
 * @param {number} [page=1] Numer strony
 *
 * @returns {Promise<PagedResponse<UserInfo>>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
// todo: search_bar i sort is never used
export async function fetchUserListRequest(
    search_bar?: string,
    sort?: SearchSort,
    filter?: UserListSearchFilter,
    page: number = 1
): Promise<PagedResponse<UserInfo>> {

  if (page < 1) {
    throw new InvalidRequestDataError("Numer strony musi być >= 1", false);
  }

    const r = await fetch(`${API_URL}/api/users/listUsers`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ filter, page }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania użytkowników");
  }

  return await r.json();
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
  if (!email) {
    throw new InvalidRequestDataError("Email jest wymagany", false);
  }

    const r = await fetch(`${API_URL}/api/users/deleteUser`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ email }),
  });

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
export async function toggleUserBlockRequest(
  userId: number,
  status: boolean
): Promise<void> {
  if (!userId || userId <= 0) {
    throw new InvalidRequestDataError("Niepoprawne ID użytkownika", false);
  }

    const r = await fetch(`${API_URL}/api/users/toggleBlock`, {
        method: "POST",
    headers: {
      ...adminHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      status,
    }),
  });

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


// Add Book View
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
    const r = await fetch(`${API_URL}/api/books/addBook`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      ...book,
      ilosc_egzemplarzy: instance_number,
    }),
  });

  if (r.status === 400) {
    throw new InvalidRequestDataError("Niepoprawne dane wejściowe", true);
  }

  if (!r.ok) {
    throw new RequestError("Błąd serwera", "Serwer odmówił odpowiedzi", 500);
  }

  const data = await r.json();

  return {
    book_id: data.Bookid,
    instance_ids: data.Copyids,
  };
}

// Rent log
/**
 * Pobiera log wypożyczeń.
 *
 * @param {string} [search_bar] fragment nazwy użytkoni
 * @param [sort]
 * @param {RentLogSearchFilter} [filter] Filtry logu
 * @param {number} [page=1] Numer strony
 *
 * @returns {Promise<PagedResponse<RentFullInfo>>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
// todo: z tą funkcją jest coś solidnie nie tak, nie ma takiego endpointa no i sygnatura jest zła ://
export async function fetchRentLog(
    search_bar?: string,
    filter?: RentLogSearchFilter,
    page: number = 1
): Promise<PagedResponse<RentFullInfo>> {

  if (page < 1) {
    throw new InvalidRequestDataError("Numer strony musi być >= 1", false);
  }

    const r = await fetch(`${API_URL}/api/books/listBorrowedBooks`, {
        method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ filter, page }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania logu wypożyczeń");
  }

  return await r.json();
}
