/**
 * @file Moduł zapytań pobierających dane z serwera.
 */

import {
    AccessDeniedError,
    API_URL,
    authHeaders,
    InvalidRequestDataError,
    RequestError,
    TargetNotFoundError
} from "./connection.ts";
import type {
    BookAdmin,
    BookSearchFilter,
    BookUser,
    PagedResponse,
    Rent,
    RentFullInfo,
    RentLogSearchFilter,
    Reservation,
    SearchSort,
    User,
    UserInfo,
    UserListSearchFilter
} from "../server_types.ts";

/**
 * Pobiera dostępne filtry wyszukiwania książek z systemu.
 * Zwraca listę autorów, gatunków, języków, wydawców oraz zakres dat wydania.
 *
 * @returns {Promise<BookSearchFilter>} Obiekt zawierający dostępne filtry wyszukiwania
 *
 * @throws {AccessDeniedError} Gdy brak tokenu użytkownika
 * @throws {RequestError} Gdy wystąpi błąd serwera lub odpowiedź zawiera kod błędu
 */
export async function fetchFiltersRequest(): Promise<BookSearchFilter> {
    const requestUrl = `${API_URL}/api/books/filters`;
    const requestOptions = {
        headers: authHeaders()
    };
    // console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    // console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        if (r.status === 400) throw new RequestError("Nie znaleziono użytkownika dla tokenu");
        throw new RequestError("Nieznany błąd serwera");
    }

    const resp = await r.json();
    console.log('Response data:', resp);

    if (resp.code !== undefined && resp.code !== 200) {
        throw new RequestError(resp.error || "Nieznany błąd serwera");
    }

    const release_date = resp.zakresy && resp.zakresy.rok_max > 0
        ? {
            from: new Date(resp.zakresy.rok_min, 0, 1),
            to: new Date(resp.zakresy.rok_max, 11, 31)
        }
        : undefined;

    return {
        author: resp.autorzy ? resp.autorzy.map((v: string) => v.split(' ')[1]) : [],
        genre: resp.gatunki || [],
        publisher: resp.wydawcy || [],
        tags: resp.tagi || [],
        language: resp.jezyki || [],
        release_date
    };
}

/**
 * Fetches the current logged-in user's profile information.
 *
 * @returns {Promise<User>} User profile data including name, email, and other account details
 *
 * @throws {InvalidRequestDataError} When user is not found for the provided token (status 400)
 * @throws {RequestError} When server returns an unexpected error status
 */
export async function fetchUserInfoRequest(): Promise<User> {
    const requestUrl = `${API_URL}/api/users/loginInfo`;
    const requestOptions = {
        method: "GET",
        headers: authHeaders(),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const response = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', response.status);

    if (response.status === 200) {
        const data: any = await response.json();
        console.log('Response data:', data);

        // Map backend fields -> frontend User type
        return {
            name: String(data?.name ?? ""),
            surname: String(data?.surname ?? ""),
            email: String(data?.email ?? ""),
            credit_card_number:
                data?.ostatnie4CyfryKarty != null && data?.ostatnie4CyfryKarty != "BRAK" ? String(data.ostatnie4CyfryKarty) : undefined,
        };
    }

    if (response.status >= 400 && response.status < 500) {
        throw new InvalidRequestDataError(
            "Błąd profilu",
            true,
            "Nie znaleziono użytkownika dla danej sesji."
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
// todo: nie zwracane przez request: publish_year, isbn_number, length, language, publisher, keywords, genre
export async function fetchBorrowedBooksRequest(): Promise<Rent[]> {
    const requestUrl = `${API_URL}/api/users/borrowedBooks`;
    const requestOptions = {
        method: "GET",
        headers: authHeaders()
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const response = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', response.status);

    if (response.status >= 400 && response.status < 500) {
        throw new InvalidRequestDataError(
            "Błąd pobierania wypożyczeń. Nie znaleziono użytkownika dla podanego tokenu.",
            true,
            "Nie znaleziono użytkownika dla podanego tokenu."
        );
    }

    if (response.status !== 200) {
        throw new RequestError(response.status.toString());
    }

    const data: any[] = await response.json();
    console.log('Response data:', data);

    return (data ?? []).map((item: any): Rent => {
        const borrowDate = new Date(String(item?.dataWypozyczenia ?? ""));
        const returnDate = new Date(String(item?.terminOddania ?? ""));

        return {
            book: {
                title: String(item?.tytul ?? ""),
                authors: item?.autor != null ? [String(item.autor)] : [],

                publish_year: undefined,
                isbn_number: undefined,
                length: undefined,
                language: undefined,
                publisher: undefined,
                keywords: undefined,
                genre: undefined,
            },
            instance_id: item?.Copyid,
            borrow_date: borrowDate,
            return_date: returnDate,
        };
    });
}

/**
 * Pobiera listę zarezerwowanych książek aktualnie zalogowanego użytkownika.
 *
 * @returns {Promise<Reservation[]>} Lista rezerwacji użytkownika (może być pusta)
 *
 * @throws {AccessDeniedError} Gdy brak tokenu użytkownika
 * @throws {TargetNotFoundError} Gdy nie znaleziono użytkownika dla tokenu
 * @throws {RequestError} Gdy wystąpi błąd serwera
 */

/* todo: nie zwracane przez request: publish_year, isbn_number, length, language, publisher, keywords, genre
        autor nie jest tablicą tylko pojedyńczą wartością
* */
export async function fetchReservedBooksRequest(): Promise<Reservation[]> {
    const requestUrl = `${API_URL}/api/users/reservedBooks`;
    const requestOptions = {
        method: "GET",
        headers: authHeaders(),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status >= 400 && r.status < 500) {
        throw new TargetNotFoundError("Nie znaleziono użytkownika dla tokenu");
    }

    if (!r.ok) {
        throw new RequestError("Błąd pobierania zarezerwowanych książek");
    }

    const data = await r.json();
    console.log('Response data:', data);

    return data.map((item: any) => ({
        book: {
            book_id: item.BookId,
            title: item.tytul,
            authors: [item.autor],

            publish_year: undefined,
            isbn_number: undefined,
            length: undefined,
            language: undefined,
            publisher: undefined,
            keywords: undefined,
            genre: undefined,
        },
        instance_id: item.Copyid,
        reserve_to: new Date(item.dataKoncaRezerwacji),
    }));
}

/**
 * Pobiera katalog użytkownika zgodnie ze specyfikacją API.
 */
// todo: stronicowanie coś nie teges bo server o nim nie informuje
// todo: nie zwraca słów kluczowych (keywords)
// todo: sortowanie po autorach odbywa się tylko po nazwiskach
export async function fetchUserCatalogRequest(
    search: string = '',
    sort?: SearchSort,
    filter?: BookSearchFilter,
    page: number = 1
): Promise<PagedResponse<BookUser>> {
    if (page < 1) {
        throw new InvalidRequestDataError("Numer strony musi być >= 1", false);
    }

    const body: any = {
        page: page,
        fragment_tytulu: search || undefined,
        sortowanie: sort
            ? {
                po_czym_sortuje: sort.key,
                rosnaco: sort.direction === 'ASC',
            }
            : undefined,
        filtry: filter
            ? {
                autor: filter.author ?? undefined,
                gatunek: filter.genre ?? undefined,
                wydawca: filter.publisher ?? undefined,
                tagi: filter.tags ?? undefined,
                jezyk: filter.language ?? undefined,
                data_wydania: filter.release_date
                    ? {
                        od: filter.release_date.from.toISOString().split("T")[0],
                        do: filter.release_date.to.toISOString().split("T")[0],
                    }
                    : undefined,
            }
            : undefined,
    };

    const requestUrl = `${API_URL}/api/books/search`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        if(r.status === 403)
            throw new AccessDeniedError("Błąd przy pobieraniu katalogu - odmowa dostepu")
        throw new RequestError(`Błąd pobierania katalogu: ${r.status} - ${r.statusText}`);
    }

    const data = await r.json();
    console.log('Response data:', data);

    // Map API snake_case response to frontend structure
    return {
        result: data.ksiazki.map((b: any) => ({
            book_id: b.Bookid,
            title: b.tytul,
            authors: b.autor,
            publish_year: b.rok_wydania,
            isbn_number: b.isbn,
            publisher: b.wydawnictwo,
            genre: b.gatunek,
            language: b.jezyk,
            length: b.liczba_stron,
            instances: {
                available: b.liczba_dostepnych,
                total: b.liczba_egzemplarzy
            }
        })),
        totalPages: data.totalPages || 1,
        totalResults: data.totalResults || data.ksiazki.length
    };
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
// todo: użyty request nie zwraca następujących informacji: length, language, publisher
export async function fetchUserBookRequest(book_id: number): Promise<BookUser> {
    const requestUrl = `${API_URL}/api/books/${book_id}`;
    const requestOptions = {
        method: "GET",
        headers: authHeaders(),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (!r.ok) {
        if (r.status === 400) {
            throw new TargetNotFoundError("Nie znaleziono książki");
        }
        throw new RequestError("Błąd pobierania książki");
    }

    const data: any = await r.json();
    console.log('Response data:', data);

    const book: BookUser = {
        book_id: Number(data?.Bookid),
        title: String(data?.tytul ?? ""),
        authors: Array.isArray(data?.autorzy) ? data.autorzy.map((a: any) => String(a)) : [],

        publish_year: Number(data?.rok_wydania ?? 0),
        isbn_number: String(data?.isbn ?? ""),

        // API doesn't send these in the shown response -> defaults required by `Book`
        length: undefined,
        language: undefined,
        publisher: undefined,

        keywords: Array.isArray(data?.slowa_kluczowe) ? data.slowa_kluczowe.map((k: any) => String(k)) : [],
        genre: Array.isArray(data?.gatunki) ? data.gatunki.map((g: any) => String(g)) : [],

        instances: {
            available: Number(data?.liczba_dostepnych ?? 0),
            total: Number(data?.liczba_egzemplarzy ?? 0),
        },
    };

    // Optional: fail fast if backend changes / returns incomplete payload
    if (!book.book_id || !book.title) {
        throw new RequestError("Invalid book payload from server");
    }

    return book;
}

/**
 * Pobiera katalog książek z paginacją, filtrowaniem i sortowaniem dla widoku administratora.
 *
 * @param {string} [search] Fragment tytułu do wyszukania
 * @param {number} [page=1] Numer strony (paginacja, domyślnie 1)
 * @param {SearchSort} [sort] Obiekt określający sortowanie wyników
 * @param {BookSearchFilter} [filter] Obiekt zawierający filtry wyszukiwania
 *
 * @returns {Promise<PagedResponse<BookAdmin>>} Obiekt stronicowany z listą książek i metadanymi
 *
 * @throws {InvalidRequestDataError} Gdy podano niepoprawny numer strony lub błędne dane filtrów
 * @throws {AccessDeniedError} Gdy brak tokenu administratora
 * @throws {RequestError} Gdy wystąpił błąd serwera podczas pobierania katalogu
 */
// todo: podobnie jak u użytkownika prawdopodobnie jest problem ze stronicowaniem
// todo: nie zwraca informacji na temat egzemplarzy, słów kluczowych
// todo: nie zwraca id, poważny błąd przy funkcji wypożyczania
export async function fetchAdminCatalogRequest(
    search?: string,
    sort?: SearchSort,
    filter?: BookSearchFilter,
    page: number = 1
): Promise<PagedResponse<BookAdmin>> {
    if (page <= 0) {
        throw new InvalidRequestDataError("Niepoprawne dane paginacji", false);
    }

    const body: any = {page};

    if (search && search.trim().length > 0) {
        body.fragment_tytulu = search;
    }

    if (sort) {
        body.sortowanie = {
            po_czym_sortuje: sort.key,
            rosnaco: sort.direction === 'ASC',
        };
    }

    if (filter) {
        body.filtry = {
            autor: filter.author ?? undefined,
            gatunek: filter.genre ?? undefined,
            wydawca: filter.publisher ?? undefined,
            tagi: filter.tags ?? undefined,
            jezyk: filter.language ?? undefined,
            data_wydania: filter.release_date
                ? {
                    od: filter.release_date.from.toISOString().split('T')[0],
                    do: filter.release_date.to.toISOString().split('T')[0],
                }
                : undefined,
        };
    }

    const requestUrl = `${API_URL}/api/books/worker/search`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 400) {
        throw new InvalidRequestDataError("Nieprawidłowe dane wyszukiwania", false);
    }

    if (r.status === 403) {
        throw new AccessDeniedError("Brak uprawnień do pobrania katalogu");
    }

    if (!r.ok) {
        throw new RequestError(`Błąd pobierania katalogu: ${r.status}`);
    }

    const json: any = await r.json();
    console.log("Response data:", json);

    const ksiazki: any[] = Array.isArray(json?.ksiazki) ? json.ksiazki : [];

    const mapInstanceStatus = (raw: any): BookAdmin["instances"][number]["status"] => {
        // backend sometimes uses "destroyed" -> in UI we treat it as "damaged"
        if (raw === "destroyed") return "damaged";
        if (raw === "available" || raw === "rented" || raw === "reserved" || raw === "damaged") return raw;
        // safest fallback (keeps UI usable even if backend adds a new state)
        return "damaged";
    };

    return {
        result: ksiazki.map((b: any): BookAdmin => ({
            book_id: b?.Bookid != null ? Number(b.Bookid) : undefined,
            title: String(b?.tytul ?? ""),
            authors: Array.isArray(b?.autor) ? b.autor.map((a: any) => String(a)) : [],

            publish_year: Number(b?.rok_wydania ?? 0),
            isbn_number: String(b?.isbn ?? ""),

            length: b?.liczba_stron != null ? Number(b.liczba_stron) : undefined,
            language: b?.jezyk != null ? String(b.jezyk) : undefined,
            publisher: b?.wydawnictwo != null ? String(b.wydawnictwo) : undefined,

            genre: Array.isArray(b?.gatunek) ? b.gatunek.map((g: any) => String(g)) : [],

            // IMPORTANT: BookAdmin requires instances[], and search endpoint returns `egzemplarze`
            instances: Array.isArray(b?.egzemplarze)
                ? b.egzemplarze
                    .map((e: any) => ({
                        id: e?.Copyid != null ? Number(e.Copyid) : Number(e?.id),
                        status: mapInstanceStatus(e?.status),
                    }))
                    .filter((e: any) => Number.isFinite(e.id))
                : [],
        })),
        totalPages: Number(json?.totalPages ?? 1),
        totalResults: Number(json?.totalResults ?? ksiazki.length),
    };
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

    const requestUrl = `${API_URL}/api/books/worker/book/${book_id}`;
    const requestOptions = {
        method: "GET",
        headers: authHeaders(),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status === 403) {
        throw new AccessDeniedError("Brak uprawnień do pobrania książki");
    }

    if (r.status === 404) {
        throw new TargetNotFoundError("Nie znaleziono książki");
    }

    if (!r.ok) {
        throw new RequestError("Błąd pobierania danych książki");
    }

    const json: any = await r.json();
    console.log("Response data:", json);


    return {
        book_id: json?.Bookid != null ? Number(json.Bookid) : undefined,
        title: String(json?.tytul ?? ""),
        authors: Array.isArray(json?.autorzy) ? json.autorzy.map((a: any) => String(a)) : [],

        publish_year: Number(json?.rok_wydania ?? 0),
        isbn_number: String(json?.isbn ?? ""),

        publisher: json?.wydawnictwo != null ? String(json.wydawnictwo) : undefined,
        language: json?.jezyk != null ? String(json.jezyk) : undefined,
        length: json?.liczba_stron != null ? Number(json.liczba_stron) : undefined,

        keywords: Array.isArray(json?.slowa_kluczowe)
            ? json.slowa_kluczowe.map((k: any) => String(k))
            : [],
        genre: Array.isArray(json?.gatunki) ? json.gatunki.map((g: any) => String(g)) : [],

        instances: Array.isArray(json?.egzemplarze)
            ? json.egzemplarze.map((e: any) => ({
                id: Number(e?.Copyid),
                status: e?.status == 'destroyed' ? 'damaged' : e?.status as BookAdmin["instances"][number]["status"],
            }))
            : [],
    };
}



/**
 * Pobiera listę użytkowników dla panelu administratora z możliwością filtrowania i sortowania.
 *
 * @param {string} [search_bar] Fragment imienia lub nazwiska do wyszukania
 * @param {SearchSort} [sort] Obiekt określający sortowanie wyników
 * @param {UserListSearchFilter} [filter] Obiekt filtrów wyszukiwania
 * @param {number} [page=1] Numer strony
 *
 * @returns {Promise<PagedResponse<UserInfo>>} Obiekt stronicowany z listą użytkowników i metadanymi
 *
 * @throws {AccessDeniedError} Gdy brak tokenu pracownika (WORKER)
 * @throws {InvalidRequestDataError} Gdy podano niepoprawny numer strony lub błędne dane wyszukiwania
 * @throws {RequestError} Gdy wystąpił błąd serwera podczas pobierania użytkowników
 */
// todo priority: backend nie odróżnia wypożyczeń od rezerwacji. Wszystko zwraca jako wyporzyczenia
// todo test: paginacja również wydaje się nie działać
export async function fetchUserListRequest(
    search_bar?: string,
    sort?: SearchSort,
    filter?: UserListSearchFilter,
    page: number = 1
): Promise<PagedResponse<UserInfo>> {

    if (page < 1) {
        throw new InvalidRequestDataError("Numer strony musi być >= 1", false);
    }

    // przetłumacz status na backendowy format
    const status_converter = {
        "blocked": "zablokowany",
        "user": 'dostepny',
        "admin": undefined
    }

    const body: any = {
        fragment: search_bar?.trim(),
        sortuj_po: sort ? {
            czym: sort.key,
            rosnaco: sort.direction === "ASC", // convert to backend bool
        } : undefined,
        status: filter && filter.status && filter.status.length > 0 ? status_converter[filter.status[0]] : undefined,
        strona: page,
    };

    const requestUrl = `${API_URL}/api/users/listUsers`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
    };
    console.log('Request to:', requestUrl, 'Options:', requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log('Response from:', requestUrl, 'Status:', r.status);

    if (r.status >= 400 && r.status < 500) {
        if (r.status == 401 || r.status == 403)
            throw new AccessDeniedError("Odmowa dostępu, wymagany dostęp pracownika");
        throw new InvalidRequestDataError("Niepoprawne dane wyszukiwania", false);
    }

    if (!r.ok) {
        throw new RequestError("Błąd pobierania użytkowników");
    }

    /**
     * typ odpowiedzi serwera na request
     * */
    interface BackendResponse {
        uzytkownicy: {
            user_id: number
            imie: string,
            nazwisko: string,
            email: string,
            is_blocked: boolean,
            wypozyczone_ksiazki : {
                nazwa: string,
                autor: string[],
                data_wypozyczenia: string,
                termin_zwrotu: string,
                naliczone_oplaty: number,
            }[]
        }[]
    }

    const json: Partial<BackendResponse> = await r.json();
    console.log('Response data:', json);
    
    return {
        result: (json.uzytkownicy ?? []).map((u): UserInfo => {
            const now = new Date();
            const hasOverdueRent = (u.wypozyczone_ksiazki  ?? []).some((w) => new Date(w.termin_zwrotu) < now);

            return {
                user_id: u.user_id,
                name: u.imie,
                surname: u.nazwisko,
                email: u.email,
                status: u.is_blocked ? 'blocked' : 'user', // admin nie odrużnialny od uzytkownika
                currently_rented: (u.wypozyczone_ksiazki  ?? []).map((w): Rent => ({
                    book: {
                        title: w.nazwa,
                        authors: w.autor,

                        publish_year: undefined,
                        isbn_number: undefined,
                        length: undefined,
                        language: undefined,
                        publisher: undefined,
                        keywords: undefined,
                        genre: undefined,
                    },
                    borrow_date: new Date(w.data_wypozyczenia),
                    return_date: new Date(w.termin_zwrotu),
                })),
                currently_reserved: [], // backend nie zwraca rezerwacji
            }
        }),
        totalPages: 1,
        totalResults: json.uzytkownicy?.length ?? 0,
    };
}

/**
 * Pobiera log wypożyczeń.
 * @param search
 * @param {RentLogSearchFilter} [filter] Filtry logu
 * @param {number} [page=1] Numer strony
 *
 * @returns {Promise<PagedResponse<RentFullInfo>>}
 *
 * @throws {AccessDeniedError}
 * @throws {InvalidRequestDataError}
 * @throws {RequestError}
 */
// todo: nie ma paginacji
// todo: nie ma opcji filtrowania searcha
// todo: nie ma statusu 'un-payed' gdy nieopłacono jeszcze długu
// todo: nie wiadomo czy ksiązka została zwrócona czy wciąż na to oczekuje (return_date nie podane)
// todo: informacje o użytkowniku nie kompletne
export async function fetchRentLog(
    search?: string,
    filter?: RentLogSearchFilter,
    page: number = 1
): Promise<PagedResponse<RentFullInfo>> {

    if (page < 1) {
        throw new InvalidRequestDataError("Numer strony musi być >= 1", false);
    }


    const toServerStatus = (
        states?: RentLogSearchFilter["states"]
    ): "all" | "aktywne" | "zwrocone" | undefined => {
        if (!states) return undefined;
        if (states === "active") return "aktywne";
        if (states === "returned") return "zwrocone";
        // "un-payed" is not supported by this endpoint spec -> safest fallback is to not apply status filter
        return undefined;
    };

    const body: any = {
        sortowanie: undefined as
            | {
            po_czym: string;
            rosnaco: boolean;
        }
            | undefined,
        filtry: undefined as
            | {
            status?: "all" | "aktywne" | "zwrocone";
            po_terminie?: boolean;
        }
            | undefined,
    };

    if (filter) {
        const status = toServerStatus(filter.states);
        const po_terminie = filter.isOverdue;

        if (status !== undefined || po_terminie !== undefined) {
            body.filtry = {
                status,
                po_terminie,
            };
        }
    }

    const requestUrl = `${API_URL}/api/books/listBorrowedBooks`;
    const requestOptions = {
        method: "POST",
        headers: authHeaders(), // WORKER token required
        body: JSON.stringify(body),
    };
    console.log("Request to:", requestUrl, "Options:", requestOptions);
    const r = await fetch(requestUrl, requestOptions);
    console.log("Response from:", requestUrl, "Status:", r.status);

    if (r.status === 400) {
        throw new InvalidRequestDataError("Niepoprawne dane.", false);
    }

    if (r.status === 500) {
        throw new RequestError("Błąd serwera.");
    }

    if (!r.ok) {
        throw new RequestError(`Błąd pobierania logu wypożyczeń: ${r.status}`);
    }

    const json: any = await r.json();
    console.log("Response data:", json);

    const wypozyczenia: any[] = Array.isArray(json?.wypozyczenia) ? json.wypozyczenia : [];

    return {
        result: wypozyczenia.map((w: any): RentFullInfo => {
            const borrowDate = new Date(String(w?.data_wypozyczenia ?? ""));
            const returnDate = w?.data_zwrotu != null ? new Date(String(w.data_zwrotu)) : null;

            return {
                user: {
                    name: String(w?.uzytkownik?.imie ?? ""),
                    surname: String(w?.uzytkownik?.nazwisko ?? ""),
                    email: String(w?.uzytkownik?.email ?? ""),
                },
                book: {
                    // Endpoint provides Copyid (instance id), but `RentFullInfo.book` is `Book` (no place to store Copyid)
                    title: String(w?.ksiazka?.tytul ?? ""),
                    authors: w?.ksiazka?.autor != null ? [String(w.ksiazka.autor)] : [],
                    publish_year: 0,
                    isbn_number: "",
                    length: undefined,
                    language: undefined,
                    publisher: undefined,
                    keywords: [],
                    genre: [],
                },
                borrow_date: borrowDate,
                // Spec doesn't provide a separate "return_to_date" vs "return_date".
                // Best-effort: keep them consistent so UI doesn't crash.
                return_to_date: returnDate ?? borrowDate,
                return_date: returnDate,
            };
        }),
        totalPages: 1,
        totalResults: wypozyczenia.length,
    };
}