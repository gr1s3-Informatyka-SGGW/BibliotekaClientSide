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

export async function cancelReservationRequest(id: number): Promise<void> {
  const r = await fetch("/api/books/cancelReservation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  if (!r.ok) {
    if (r.status === 400) {
      throw new TargetNotFoundError("Nie znaleziono rezerwacji");
    }
    throw new RequestError("Błąd anulowania rezerwacji");
  }
}

export async function claimReservationRequest(id: number): Promise<void> {
  const r = await fetch("/api/books/takeBook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  if (!r.ok) {
    throw new RequestError("Błąd odbioru rezerwacji");
  }
}

export async function extendRentRequest(id: number): Promise<void> {
  const r = await fetch("/api/books/extendRent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  if (!r.ok) {
    throw new RequestError("Błąd przedłużania wypożyczenia");
  }
}

export async function returnBookRequest(id: number): Promise<void> {
  const r = await fetch("/api/books/returnBook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
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
 * @throws {RequestError} Gdy wystąpi błąd po stronie serwera
 */
export async function fetchAuthorsRequest(): Promise<string[]> {
  const r = await fetch("/api/dictionaries/authors");

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
 * @throws {RequestError} Gdy wystąpi błąd po stronie serwera
 */
export async function fetchTagsRequest(): Promise<string[]> {
  const r = await fetch("/api/dictionaries/tags");

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
 * @throws {RequestError} Gdy wystąpi błąd po stronie serwera
 */
export async function fetchGenresRequest(): Promise<string[]> {
  const r = await fetch("/api/dictionaries/genres");

  if (!r.ok) {
    throw new RequestError("Błąd pobierania gatunków");
  }

  return await r.json();
}

/**
 * Pobiera listę wydawców książek.
 *
 * @returns {Promise<string[]>} Lista wydawców
 *
 * @throws {RequestError} Gdy wystąpi błąd po stronie serwera
 */
export async function fetchPublishersRequest(): Promise<string[]> {
  const r = await fetch("/api/dictionaries/publishers");

  if (!r.ok) {
    throw new RequestError("Błąd pobierania wydawców");
  }

  return await r.json();
}

/**
 * Pobiera listę języków dostępnych w katalogu.
 *
 * @returns {Promise<string[]>} Lista języków
 *
 * @throws {RequestError} Gdy wystąpi błąd po stronie serwera
 */
export async function fetchLanguagesRequest(): Promise<string[]> {
  const r = await fetch("/api/dictionaries/languages");

  if (!r.ok) {
    throw new RequestError("Błąd pobierania języków");
  }

  return await r.json();
}

// Katalog - User
export async function fetchUserCatalogRequest(
  search: string,
  sort?: SearchSort,
  filter?: BookSearchFilter,
  page: number = 1
): Promise<PagedResponse<BookUser>> {

  if (page < 1) {
    throw new InvalidRequestDataError("Numer strony musi być >= 1", false);
  }

  const body: any = {
    page,
    fragment_tytulu: search ?? ""
  };

  if (sort) {
    body.sortowanie = {
      po_czym_sortuje: sort.key,
      rosnaco: sort.direction === "ASC"
    };
  }

  if (filter) {
    body.filtry = {
      autor: filter.author,
      gatunek: filter.genre,
      wydawca: filter.publisher,
      tagi: filter.tags,
      jezyk: filter.language,
      data_wydania: filter.release_date
        ? {
            od: filter.release_date.from.toISOString().slice(0, 10),
            do: filter.release_date.to.toISOString().slice(0, 10)
          }
        : undefined
    };
  }

  const r = await fetch("/api/books/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    if (r.status === 400) {
      throw new InvalidRequestDataError("Niepoprawne dane wyszukiwania", true);
    }
    throw new RequestError("Błąd pobierania katalogu");
  }

  return await r.json();
}

export async function rentBookRequest(book_id: number): Promise<void> {
  const r = await fetch("/api/books/rentBook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: book_id })
  });

  if (!r.ok) {
    if (r.status === 400) {
      throw new InvalidRequestDataError("Nie można wypożyczyć książki", true);
    }
    throw new RequestError("Błąd wypożyczania książki");
  }
}

export async function reserveBookRequest(book_id: number): Promise<void> {
  const r = await fetch("/api/books/reserveBook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: book_id })
  });

  if (!r.ok) {
    if (r.status === 400) {
      throw new InvalidRequestDataError("Nie można zarezerwować książki", true);
    }
    throw new RequestError("Błąd rezerwacji książki");
  }
}

export async function fetchUserBookRequest(book_id: number): Promise<BookUser> {
  const r = await fetch(`/api/books/${book_id}`);

  if (!r.ok) {
    if (r.status === 400) {
      throw new TargetNotFoundError("Nie znaleziono książki");
    }
    throw new RequestError("Błąd pobierania książki");
  }

  return await r.json();
}

// Katalog - Admin
export async function fetchAdminCatalogRequest(
  search: string,
  sort?: SearchSort,
  filter?: BookSearchFilter,
  page: number = 1
): Promise<PagedResponse<BookAdmin>> {

  const r = await fetch("/api/books/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page,
      fragment_tytulu: search,
      sortowanie: sort && {
        po_czym_sortuje: sort.key,
        rosnaco: sort.direction === "ASC"
      },
      filtry: filter
    })
  });

  if (!r.ok) {
    throw new RequestError("Błąd pobierania katalogu administratora");
  }

  return await r.json();
}

export async function fetchAdminBookRequest(book_id: number): Promise<BookAdmin> {
  const r = await fetch(`/api/books/${book_id}/admin`);

  if (!r.ok) {
    if (r.status === 400) {
      throw new TargetNotFoundError("Nie znaleziono książki");
    }
    throw new RequestError("Błąd pobierania książki");
  }

  return await r.json();
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
 * @throws {InvalidRequestDataError} Gdy egzemplarz nie istnieje lub jest już oznaczony jako zniszczony
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
    throw new InvalidRequestDataError("Egzemplarz nie istnieje lub już zniszczony", true);
  }
  if (!r.ok) {
    throw new RequestError("Błąd oznaczania egzemplarza");
  }
}

/**
 * Przywraca egzemplarz książki jako niezniszczony.
 *
 * @param {number} instance_id Identyfikator egzemplarza
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy egzemplarz nie był oznaczony jako zniszczony
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function markMendedBookInstanceRequest(instance_id: number): Promise<void> {
  if (!instance_id) {
    throw new InvalidRequestDataError("Brak id egzemplarza", false);
  }

  const r = await fetch("/api/users/copies/markUndestroyed", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id_egzemplarza: instance_id }),
  });

  if (r.status === 400) {
    throw new InvalidRequestDataError("Egzemplarz nie był zniszczony", true);
  }
  if (!r.ok) {
    throw new RequestError("Błąd przywracania egzemplarza");
  }
}

/**
 * Dodaje nowy egzemplarz istniejącej książki.
 *
 * @param {number} book_id Identyfikator książki
 *
 * @returns {Promise<{ instance_id: number }>} Id nowo utworzonego egzemplarza
 *
 * @throws {InvalidRequestDataError} Gdy nie podano id książki
 * @throws {TargetNotFoundError} Gdy książka nie istnieje
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function addBookInstanceRequest(book_id: number): Promise<{ instance_id: number }> {
  if (!book_id) {
    throw new InvalidRequestDataError("Brak id książki", false);
  }

  const r = await fetch("/api/users/books/addCopy", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id_ksiazki: book_id }),
  });

  if (r.status === 400) {
    throw new TargetNotFoundError("Nie znaleziono książki");
  }
  if (!r.ok) {
    throw new RequestError("Błąd dodawania egzemplarza");
  }

  return await r.json();
}

// Users
/**
 * Pobiera listę użytkowników z systemu (ADMIN).
 *
 * @param {string} [search_bar] Fragment tekstu do wyszukiwania użytkowników
 * @param {SearchSort} [sort] Opcje sortowania wyników
 * @param {UserListSearchFilter} [filter] Filtry listy użytkowników
 *
 * @returns {Promise<UserInfo[]>} Lista użytkowników spełniających kryteria
 *
 * @throws {InvalidRequestDataError} Gdy przekazane filtry lub sortowanie są niepoprawne
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchUserListRequest(
  search_bar?: string,
  sort?: SearchSort,
  filter?: UserListSearchFilter
): Promise<UserInfo[]> {
  const r = await fetch("/api/users/listUsers", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      fragment: search_bar,
      sortuj_po: sort,
      status: filter?.status,
    }),
  });

  if (r.status === 400) {
    throw new InvalidRequestDataError("Niepoprawne dane wyszukiwania", true);
  }
  if (!r.ok) {
    throw new RequestError("Błąd pobierania listy użytkowników");
  }

  const data = await r.json();
  return data.uzytkownicy;
}

/**
 * Usuwa użytkownika z systemu.
 *
 * @param {number} user_id Identyfikator użytkownika
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy nie podano id użytkownika
 * @throws {TargetNotFoundError} Gdy użytkownik nie istnieje
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function removeUserRequest(user_id: number): Promise<void> {
  if (!user_id) {
    throw new InvalidRequestDataError("Brak id użytkownika", false);
  }

  const r = await fetch("/api/users/deleteUser", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id: user_id }),
  });

  if (r.status === 400) {
    throw new TargetNotFoundError("Nie znaleziono użytkownika");
  }
  if (!r.ok) {
    throw new RequestError("Błąd usuwania użytkownika");
  }
}

/**
 * Blokuje użytkownika w systemie.
 *
 * @param {number} user_id Identyfikator użytkownika
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy nie podano id użytkownika
 * @throws {TargetNotFoundError} Gdy użytkownik nie istnieje
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function blockUserRequest(user_id: number): Promise<void> {
  if (!user_id) {
    throw new InvalidRequestDataError("Brak id użytkownika", false);
  }

  const r = await fetch("/api/users/blockUser", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id: user_id }),
  });

  if (r.status === 400) {
    throw new TargetNotFoundError("Nie znaleziono użytkownika");
  }
  if (!r.ok) {
    throw new RequestError("Błąd blokowania użytkownika");
  }
}

/**
 * Odblokowuje użytkownika w systemie.
 *
 * @param {number} user_id Identyfikator użytkownika
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy nie podano id użytkownika
 * @throws {TargetNotFoundError} Gdy użytkownik nie istnieje
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function unblockUserRequest(user_id: number): Promise<void> {
  if (!user_id) {
    throw new InvalidRequestDataError("Brak id użytkownika", false);
  }

  const r = await fetch("/api/users/unblockUser", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ id: user_id }),
  });

  if (r.status === 400) {
    throw new TargetNotFoundError("Nie znaleziono użytkownika");
  }
  if (!r.ok) {
    throw new RequestError("Błąd odblokowywania użytkownika");
  }
}

/**
 * Dodaje nowego administratora systemu.
 *
 * @param {User} admin_info Dane nowego administratora
 *
 * @returns {Promise<void>}
 *
 * @throws {InvalidRequestDataError} Gdy dane administratora są niekompletne lub niepoprawne
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function addAdminRequest(admin_info: User): Promise<void> {
  if (!admin_info?.email) {
    throw new InvalidRequestDataError("Niepoprawne dane admina", false);
  }

  const r = await fetch("/api/users/addAdmin", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(admin_info),
  });

  if (r.status === 400) {
    throw new InvalidRequestDataError("Niepoprawne dane", true);
  }
  if (!r.ok) {
    throw new RequestError("Błąd dodawania admina");
  }
}


// Add Book View
/**
 * Dodaje nową książkę do systemu.
 *
 * @param {Book} book Dane książki
 *
 * @returns {Promise<{ book_id: number }>} Id nowo dodanej książki
 *
 * @throws {InvalidRequestDataError} Gdy dane książki są niekompletne lub niepoprawne
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function addBookRequest(book: Book): Promise<{ book_id: number }> {
  const r = await fetch("/api/books/addBook", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(book),
  });

  if (r.status === 400) {
    throw new InvalidRequestDataError("Niepoprawne dane książki", true);
  }
  if (!r.ok) {
    throw new RequestError("Błąd dodawania książki");
  }

  return await r.json();
}

// Rent log
/**
 * Pobiera log wypożyczeń książek.
 *
 * @param {string} [search_bar] Fragment tekstu do wyszukiwania
 * @param {SearchSort} [sort] Opcje sortowania
 * @param {RentLogSearchFilter} [filter] Filtry wypożyczeń
 *
 * @returns {Promise<RentFullInfo>} Lista wypożyczeń wraz z metadanymi
 *
 * @throws {InvalidRequestDataError} Gdy przekazane filtry są niepoprawne
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */
export async function fetchRentLog(
  search_bar?: string,
  sort?: SearchSort,
  filter?: RentLogSearchFilter
): Promise<RentFullInfo> {
  const r = await fetch("/api/books/listRentedBooks", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      sortowanie: sort,
      filtry: filter,
    }),
  });

  if (r.status === 400) {
    throw new InvalidRequestDataError("Niepoprawne dane zapytania", true);
  }
  if (!r.ok) {
    throw new RequestError("Błąd pobierania logów wypożyczeń");
  }

  return await r.json();
}
