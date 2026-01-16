/**
 * @file Plik zawierający funkcje obsługujące komunikację z bazą danych
 * */

import { SAMPLE_AUTHORS, SAMPLE_TAGS, SAMPLE_GENRES, SAMPLE_PUBLISHERS, SAMPLE_LANGUAGES, SAMPLE_BOOKS } from "./fake_catalog_data.ts";
import { wait, randDelay, matchesFilter, applySort, toBookUser, paginate } from "./fake_catalog_data.ts";
import { SAMPLE_USERS } from "./fake_users_data.ts";

import type {
    Book,
    BookAdmin,
    BookSearchFilter,
    SearchSort,
    BookUser,
    CreditCardInfo,
    Session,
    User, UserInfo, RentLogSearchFilter, UserListSearchFilter, RentFullInfo,
    PagedResponse,
    UsersListResponse, Reservation, Rent,
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

export async function cancelReservationRequest(reservation_id: number): Promise<void>{
    wait(randDelay());
    throw Error("Not implemented exception")
}
export async function claimReservationRequest(reservation_id: number): Promise<void>{
    wait(randDelay());
    throw Error("Not implemented exception")
}

export async function extendRentRequest(rent_id: number): Promise<void>{
    wait(randDelay());
    throw Error("Not implemented exception")
}

export async function returnBookRequest(rend_id: number): Promise<void>{
    wait(randDelay());
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

export async function rentBookRequest(book_id: number): Promise<void>{
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

export async function editBookRequest(book:Book){
    const r = await fetch("/api/book/update", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(book)
    })
    if (!r.ok) throw Error()
}
export async function removeBookRequest(book_id: number): Promise<void> {
    const index = SAMPLE_BOOKS.findIndex(book => book.book_id === book_id);

    if (index !== -1) {
        SAMPLE_BOOKS.splice(index, 1);
    }
}
export async function removeBookInstanceRequest(instance_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export async function markDamagedBookInstanceRequest(instance_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
export async function markMendedBookInstanceRequest(instance_id: number): Promise<void>{
    throw Error("Not implemented exception")
}
let mockInstanceCounter = 1;
export async function addBookInstanceRequest(book_id: number): Promise<{ instance_id: number }> {
    if (USE_MOCK) {
        const fakeId = mockInstanceCounter++;
        console.log("MOCK addBookInstanceRequest:", book_id, "->", fakeId);

        return {
            instance_id: fakeId
        };
    }
    const r = await fetch("/api/book-instance/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id })
    });

    if (!r.ok) throw Error();
    return await r.json();
}
// Users

export async function fetchUserListRequest(
    search_bar?: string,
    sort?: SearchSort,
    filter?: UserListSearchFilter,
    page: number = 1
): Promise<PagedResponse<UserInfo>> {
    if (USE_MOCK) {
        new Promise(resolve => setTimeout(resolve, 500));

        const PAGE_SIZE = 5;

        // Pobieramy książki do mockowania danych
        const generatedUsers: UserInfo[] = SAMPLE_USERS

        // --- FILTROWANIE I SORTOWANIE ---
        let filtered = [...generatedUsers];

        if (filter?.status && filter.status.length > 0) {
            filtered = filtered.filter(u => filter.status?.includes(u.status));
        }

        if (search_bar && search_bar !== "") {
            const query = search_bar.toLocaleLowerCase();
            filtered = filtered.filter(u =>
                (u.name + " " + u.surname).toLocaleLowerCase().includes(query) ||
                u.email.toLocaleLowerCase().includes(query)
            );
        }

        if (sort) {
            filtered.sort((a, b) => {
                const dir = sort.direction === 'ASC' ? 1 : -1;
                if (sort.key === 'surname') return a.surname.localeCompare(b.surname) * dir;
                if (sort.key === 'name') return a.name.localeCompare(b.name) * dir;
                return 0;
            });
        }

        // --- LOGIKA PAGINACJI I ODPOWIEDZI ---
        const totalUsers = filtered.length;
        const totalPages = Math.ceil(totalUsers / PAGE_SIZE);

        // Zabezpieczenie przed stroną poza zakresem
        const safePage = Math.max(1, Math.min(page, totalPages || 1));
        const startIndex = (safePage - 1) * PAGE_SIZE;
        const paginatedUsers = filtered.slice(startIndex, startIndex + PAGE_SIZE);

        return {
            result: paginatedUsers,
            totalPages: totalPages,
            totalResults: totalUsers
        };
    } else {
        throw Error("Not implemented exception");
    }
}

export async function removeUserRequest(user_id: number) {
    if (USE_MOCK) {
        new Promise(resolve => setTimeout(resolve, 300));
        if (Math.random() > 0.5) {
            throw new Error("Nie udało się usunąć użytkownika.");
        } else {
            return;
        }
    } else {
        throw Error("Not implemented exception");
    }
}
export async function blockUserRequest(user_id: number) {
    if (USE_MOCK) {

        new Promise(resolve => setTimeout(resolve, 300));
        if (Math.random() > 0.5) {
            throw new Error("Nie udało się zablokować użytkownika. Błąd połączenia lub brak uprawnień.");
        } else {
            return;
        }
    } else {
        throw Error("Not implemented exception");
    }
}
export async function unblockUserRequest(user_id: number) {
    if (USE_MOCK) {
        new Promise(resolve => setTimeout(resolve, 300));
        if (Math.random() > 0.5) {
            throw new Error("Nie udało się odblokować użytkownika. Błąd połączenia lub brak uprawnień.");
        } else {
            return;
        }
    } else {
        throw Error("Not implemented exception");
    }
}
export async function addAdminRequest(admin_info: User): Promise<void> {
    if (USE_MOCK) {
        new Promise(resolve => setTimeout(resolve, 600));
        if (Math.random() > 0.5) {
            throw new Error("Nie udało się dodać nowego bibliotekarza. Błąd połączenia lub brak uprawnień.");
        } else {
            return;
        }
    } else {
        throw Error("Not implemented exception");
    }
}

// Add Book View
const USE_MOCK = true;
export async function addBookRequest(book: Book): Promise<{ book_id: number }> {
    if (USE_MOCK) {
        return { book_id: Date.now() };
    }
    const r = await fetch("/api/book/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book)
    });

    if (!r.ok) throw Error();

    return await r.json();
}
export async function fetchRentLog(search_bar?: string, sort?: SearchSort, filter?: RentLogSearchFilter, page: number = 1): Promise<PagedResponse<RentFullInfo>>{
    if(!USE_MOCK)
        throw Error("Not implemented exception");
    const book:Book = {
        title: "Ogniem i mieczem",
        authors: ['Henryk Sienkiewicz', "Andrzej Duda"],
        publish_year: 1985,
        isbn_number: "978-83-7583-610-3",
        length: 835,
        language: "Polski",
        publisher: "Nasza księgarnia",
        keywords: ["Nudne", "Test", "Smoki"],
        genre: ["Fantazy", "Sci-Fi"]
    }
    const RENTLOGS_PER_PAGE = 3
    const book_list = [{
        user: {name: 'Andrzej', surname: 'Kowalski', email: 'pływać@gmail.com'},
        book: book,
        borrow_date: new Date('12.20.2025'),
        return_date: new Date('01.10.2026'),
        return_to_date:  new Date('01.8.2026')
    },
        {
            user: {name: 'Anna', surname: 'Grabowska', email: 'konno@gmail.com'},
            book: book,
            borrow_date: new Date('12.20.2025'),
            return_date: null,
            return_to_date:  new Date('01.8.2026')
        },
        {
            user: {name: 'Maja', surname: 'Poznańska', email: 'metrem@gmail.com'},
            book: book,
            borrow_date: new Date('12.20.2025'),
            return_date: new Date('01.08.2026'),
            return_to_date: new Date(Date.now()+2*24*60*10000)
        },
        {
            user: {name: 'Marian', surname: 'Gruziński', email: 'pojazdem@gmail.com'},
            book: book,
            borrow_date: new Date('12.20.2025'),
            return_date: null,
            return_to_date:  new Date(Date.now()+2*24*60*10000)
        }
    ]
    let result = page == 1 ? [book_list[0], book_list[1], book_list[2]] : [book_list[3], book_list[4]]

    return {
        result: result, totalPages: 2, totalResults: 5

    }
}

