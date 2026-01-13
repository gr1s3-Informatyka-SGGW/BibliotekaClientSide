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
    throw Error("Not implemented exception")
}


export async function fetchBorrowedBooksRequest(): Promise<Rent[]>{
    wait(randDelay());
    return [
        {
            book: {
                book_id: 101,
                title: "Władca Pierścieni: Drużyna Pierścienia",
                authors: ["J.R.R. Tolkien"],
                isbn_number: "978-83-7298-953-6",
                publish_year: 1954,
                publisher: "George Allen & Unwin",
                genre: ["Fantasy", "Przygoda"],
                language: "Polski",
                length: 423,
                keywords: ["Pierścień", "Hobbit"]
            },
            borrow_date: new Date("2025-01-01"),
            return_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // teraz + dwa dni
        },
        {
            book: {
                book_id: 102,
                title: "Harry Potter i Kamień Filozoficzny",
                authors: ["J.K. Rowling"],
                isbn_number: "978-83-7278-162-8",
                publish_year: 1997,
                publisher: "Media Rodzina",
                genre: ["Fantasy"],
                language: "Polski",
                length: 320,
                keywords: ["Magia", "Czarodziej"]
            },
            borrow_date: new Date("2025-01-10"),
            return_date:  new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // teraz - dwa dni
        },
        {
            book: {
                book_id: 103,
                title: "Wiedźmin: Ostatnie życzenie",
                authors: ["Andrzej Sapkowski"],
                isbn_number: "978-83-7578-845-5",
                publish_year: 1993,
                publisher: "superNOWA",
                genre: ["Fantasy"],
                language: "Polski",
                length: 288,
                keywords: ["Wiedźmin", "Potwory"]
            },
            borrow_date: new Date("2025-01-15"),
            return_date: new Date("2025-02-15")
        },
        {
            book: {
                book_id: 104,
                title: "1984",
                authors: ["George Orwell"],
                isbn_number: "978-83-7779-483-2",
                publish_year: 1949,
                publisher: "Muza",
                genre: ["Dystopia", "Science Fiction"],
                language: "Polski",
                length: 328,
                keywords: ["Totalitaryzm", "Kontrola"]
            },
            borrow_date: new Date("2025-01-20"),
            return_date: new Date("2025-02-20")
        }
    ];
}

export async function fetchReservedBooksRequest(): Promise<Reservation[]> {
    wait(randDelay());
    return [
        {
            book: {
                book_id: 201,
                title: "Hobbit, czyli tam i z powrotem",
                authors: ["J.R.R. Tolkien"],
                isbn_number: "978-83-244-0308-0",
                publish_year: 1937,
                publisher: "SuperNowa",
                genre: ["Fantasy"],
                language: "Polski",
                length: 310,
                keywords: ["Smok", "Bilbo"]
            },
            reserve_to: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        },
        {
            book: {
                book_id: 202,
                title: "Solaris",
                authors: ["Stanisław Lem"],
                isbn_number: "978-83-08-04803-6",
                publish_year: 1961,
                publisher: "Wydawnictwo Literackie",
                genre: ["Science Fiction"],
                language: "Polski",
                length: 204,
                keywords: ["Kosmos", "Planeta"]
            },
            reserve_to: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
            book: {
                book_id: 203,
                title: "Zbrodnia i kara",
                authors: ["Fiodor Dostojewski"],
                isbn_number: "978-83-240-3297-8",
                publish_year: 1866,
                publisher: "Znak",
                genre: ["Klasyka", "Thriller psychologiczny"],
                language: "Polski",
                length: 672,
                keywords: ["Moralność", "Wina"]
            },
            reserve_to: new Date("2025-02-10")
        }
    ];
}

// Katalog - Ogólne

export async function fetchAuthorsRequest(): Promise<string[]>{
    wait(randDelay());
    return SAMPLE_AUTHORS;
}

export async function fetchTagsRequest(): Promise<string[]>{
    wait(randDelay());
    return SAMPLE_TAGS;
}

export async function fetchGenresRequest(): Promise<string[]>{
    wait(randDelay());
    return SAMPLE_GENRES;
}

export async function  fetchPublishersRequest(): Promise<string[]>{
    wait(randDelay());
    return SAMPLE_PUBLISHERS;
}

export async function fetchLanguagesRequest(): Promise<string[]>{
    wait(randDelay());
    return SAMPLE_LANGUAGES;
}
// Katalog - User
export async function fetchUserCatalogRequest(
    search: string,
    sort?: SearchSort,
    filter?: BookSearchFilter,
    page: number = 1
): Promise<PagedResponse<BookUser>>{
    wait(randDelay());

    let results = SAMPLE_BOOKS.filter(b => matchesFilter(b, search, filter));
    results = applySort(results, sort);

    const { items, totalPages } = paginate(results, page, 10);
    const totalBooks = results.length;
    const userBooks = (items as BookAdmin[]).map(toBookUser);
    return { result: userBooks, totalPages, totalResults: totalBooks };
}

export async function rentBookRequest(book_id: number, instance_id?: number): Promise<void>{
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
): Promise<PagedResponse<BookAdmin>> => {
    wait(randDelay());

    let results = SAMPLE_BOOKS.filter(b => matchesFilter(b, search, filter));
    results = applySort(results, sort);

    const { items, totalPages } = paginate(results, page, 10);
    const totalBooks = results.length;
    return { result: items as BookAdmin[], totalPages, totalResults: totalBooks };
};
export const fetchAdminBookRequest = async (book_id: number): Promise<BookAdmin> => {
    const bookAdmin = SAMPLE_BOOKS.find((b: BookAdmin) => b.book_id === book_id);
    if (!bookAdmin) { throw `Nie znaleziono książki o book_id = ${book_id}` }
    return bookAdmin;
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
