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
    PagedResponse
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

function adminHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new AccessDeniedError("Brak tokenu administratora");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function authHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new AccessDeniedError("Brak tokenu użytkownika");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
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

/**
 * Anuluje rezerwację książki.
 *
 * @param {number} reservation_id Id rezerwacji
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function cancelReservationRequest(
  reservation_id: number
): Promise<void> {
  if (reservation_id <= 0) {
    throw new InvalidRequestDataError("Niepoprawne ID rezerwacji", false);
  }

  const r = await fetch("/api/books/cancelReservation", {
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
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function claimReservationRequest(
  reservation_id: number
): Promise<void> {
  if (reservation_id <= 0) {
    throw new InvalidRequestDataError("Niepoprawne ID rezerwacji", false);
  }

  const r = await fetch("/api/books/takeBook", {
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

  const r = await fetch("/api/books/extendRent", {
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

  const r = await fetch("/api/books/returnBook", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ rent_id }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd zwrotu książki");
  }
}

export async function fetchBorrowedBooksRequest(): Promise<Book[]>{
    throw Error("Not implemented exception")
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
  const r = await fetch("/api/books/authors", {
    headers: authHeaders(),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania autorów");
  }

  return await r.json();
}

/**
 * Pobiera listę tagów książek.
 *
 * @returns {Promise<string[]>} Lista tagów
 *
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchTagsRequest(): Promise<string[]> {
  const r = await fetch("/api/books/tags", {
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
  const r = await fetch("/api/books/genres", {
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
  const r = await fetch("/api/books/publishers", {
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
  const r = await fetch("/api/books/languages", {
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

  const r = await fetch("/api/books/search", {
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
 * @param {number} book_id Id książki
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError} Gdy brak tokenu użytkownika
 * @throws {InvalidRequestDataError} Gdy id książki jest niepoprawne
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function rentBookRequest(book_id: number): Promise<void> {
  if (book_id <= 0) {
    throw new InvalidRequestDataError("Niepoprawne ID książki", false);
  }

  const r = await fetch("/api/books/rentBook", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ book_id }),
  });

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

  const r = await fetch("/api/books/reserveBook", {
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
  const r = await fetch(`/api/books/${book_id}`, {
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
 * @param {number} page Numer strony
 * @param {number} limit Liczba elementów na stronę
 * @param {BookSearchFilter | undefined} filter Filtry wyszukiwania
 * @param {SearchSort | undefined} sort Sortowanie wyników
 * 
 * @returns {Promise<PagedResponse<BookAdmin>>}
 * 
 * @throws {InvalidRequestDataError} Gdy podano niepoprawne dane zapytania
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchAdminCatalogRequest(
  page: number,
  limit: number,
  filter?: BookSearchFilter,
  sort?: SearchSort
): Promise<PagedResponse<BookAdmin>> {
  if (page <= 0 || limit <= 0) {
    throw new InvalidRequestDataError(
      "Niepoprawne dane paginacji",
      false
    );
  }

  const r = await fetch("/api/books/search", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      page,
      limit,
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

  const r = await fetch(`/api/books/worker/book/${book_id}`, {
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

  const r = await fetch("/api/users/books/edit", {
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

  const r = await fetch("/api/users/books/delete", {
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

  const r = await fetch("/api/users/copies/delete", {
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

  const r = await fetch("/api/users/copies/markDestroyed", {
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

  const r = await fetch("/api/users/copies/markUndestroyed", {
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

  const r = await fetch("/api/books/addCopy", {
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
 * @param {UserListSearchFilter} [filter] Filtry wyszukiwania
 * @param {number} [page=1] Numer strony
 *
 * @returns {Promise<PagedResponse<UserInfo>>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function fetchUserListRequest(
  filter?: UserListSearchFilter,
  page: number = 1
): Promise<PagedResponse<UserInfo>> {

  if (page < 1) {
    throw new InvalidRequestDataError("Numer strony musi być >= 1", false);
  }

  const r = await fetch("/api/users/listUsers", {
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

  const r = await fetch("/api/users/deleteUser", {
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

  const r = await fetch("/api/users/toggleBlock", {
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

/**
 * Rejestruje nowego pracownika/admina.
 *
 * @param name Imię pracownika
 * @param surname Nazwisko pracownika
 * @param email Email pracownika
 * @param password Hasło pracownika
 * @param phone Numer telefonu pracownika
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
  password: string,
  phone: string
): Promise<void> {
  if (!name || !surname || !email || !password || !phone) {
    throw new InvalidRequestDataError("Brak wymaganych danych", false);
  }

  const r = await fetch("/api/users/registerWorker", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ name, surname, email, password, phone }),
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

// Add Book View
/**
 * Dodaje nową książkę.
 *
 * @param {Book} book Dane książki
 *
 * @returns {Promise<void>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function addBookRequest(book: Book): Promise<void> {
  const r = await fetch("/api/books/addBook", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(book),
  });

  if (!r.ok) {
    throw new RequestError("Błąd dodawania książki");
  }
}

// Rent log
/**
 * Pobiera log wypożyczeń.
 *
 * @param {RentLogSearchFilter} [filter] Filtry logu
 * @param {number} [page=1] Numer strony
 *
 * @returns {Promise<PagedResponse<RentFullInfo>>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
export async function fetchRentLog(
  filter?: RentLogSearchFilter,
  page: number = 1
): Promise<PagedResponse<RentFullInfo>> {

  if (page < 1) {
    throw new InvalidRequestDataError("Numer strony musi być >= 1", false);
  }

  const r = await fetch("/api/books/listRentedBooks", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ filter, page }),
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania logu wypożyczeń");
  }

  return await r.json();
}
