/**
 * @file Implementuje główny widok katalogu bibliotecznego (CatalogView).
 * Komponent ten stanowi centralny punkt wyszukiwania i przeglądania zasobów biblioteki,
 * dostosowując interfejs oraz uprawnienia do roli zalogowanego użytkownika (użytkownik/bibliotekarz).
 * * Funkcjonalności widoku:
 * - Dynamiczne renderowanie listy książek przy użyciu odpowiednich komponentów (`AdminBookComponent` lub `UserBookComponent`).
 * - Zaawansowane filtrowanie wielokrotnego wyboru (autor, tagi, gatunek, wydawca, język).
 * - Filtrowanie według zakresu dat wydania.
 * - Sortowanie wyników (alfabetyczne, według roku wydania).
 * - Pełnotekstowe wyszukiwanie fraz za pomocą panelu wyszukiwania.
 * - Paginacja wyników z automatycznym przewijaniem strony do góry.
 * - Zarządzanie stanem filtrów, w tym funkcja całkowitego resetowania kryteriów wyszukiwania.
 * - Automatyczne pobieranie dostępnych opcji filtrów z serwera przy inicjalizacji.
 * @author Aleksander Grzegrzułka
 */
import { useCallback, useContext, useEffect, useRef, useState, type JSX } from "react";
import { type BookSearchFilter, type SearchSort, type PagedResponse, type Book, type BookUser, type BookAdmin } from "../server/server_types.ts";
import AdminBookComponent from "../elements_admin/AdminBookComponent";
import "./CatalogView.css";
import NavSidebar from "./NavSidebar";
import SearchPanel, { type SearchPanelReturn } from "./SearchPanel";
import UserBookComponent from "../elements_user/UserBookComponent";
import {
    fetchAdminCatalogRequest,
    fetchUserCatalogRequest,
    reserveBookRequest,
    rentBookRequest,
    addBookInstanceRequest,
    removeBookRequest,
    editBookRequest,
    removeBookInstanceRequest,
    markDamagedBookInstanceRequest,
    markMendedBookInstanceRequest,
    fetchAdminBookRequest,
    fetchUserBookRequest, fetchFiltersRequest
} from "../server/server_requests.ts";
import catalogIcon from "/assets/newsstand.svg"
import { AuthContext } from "../server/UserAuth.tsx";
import { CustomSelect, CustomOption, FilterResetButton } from "../custom_components/CustomSelect.tsx";
import { Pagination } from "./Pagination.tsx";
import Popup, {Alert} from "../custom_components/Popup.tsx";
import iconError from "/assets/error.svg"
import { AddBookForm } from "../elements_admin/AddBookView.tsx";
import { useSearchParams } from "react-router-dom";
import InstanceQR from "../elements_admin/InstanceQR.tsx";

/**
 * Wykonuje żądanie do API w celu pobrania listy książek na podstawie parametrów wyszukiwania.
 * @param {boolean} isLibrarian - Flaga określająca, czy pobrać dane z punktu końcowego dla administratora.
 * @param {string} search_bar - Fraza wpisana w wyszukiwarkę.
 * @param {SearchSort} [sort] - Obiekt definiujący klucz i kierunek sortowania.
 * @param {BookSearchFilter} [filter] - Obiekt zawierający wybrane kategorie filtrów.
 * @param {number} [page=1] - Numer żądanej strony wyników.
 * @returns { Promise<PagedResponse<Book>>} Obiekt z listą książek oraz liczbą wszystkich stron i książek.
 */
const fetchCatalogRequest = (isLibrarian: boolean, search_bar: string, sort?: SearchSort, filter?: BookSearchFilter, page: number = 1):
    Promise<PagedResponse<Book>> => {
    try {
        if (isLibrarian) {
            return fetchAdminCatalogRequest(search_bar, sort, filter, page);
        } else {
            return fetchUserCatalogRequest(search_bar, sort, filter, page);
        }
    } catch(e: any) {
        console.error(e);
        return Promise.resolve(
            { result: [], totalPages: 0, totalResults: 0 }
        )
    }
}

/**
 * Wykonuje żądanie do API w celu pobrania danych pojedynczej książki.
 * @param {boolean} isLibrarian - Flaga określająca, czy pobrać dane z punktu końcowego dla administratora.
 * @param {number} book_id - Unikalny identyfikator książki.
 * @returns {Promise<Book>} Obiekt zawierający szczegóły książki.
 */
const fetchBookRequest = (isLibrarian: boolean, book_id: number):
    Promise<Book> => {
    if (isLibrarian) {
        return fetchAdminBookRequest(book_id);
    } else {
        return fetchUserBookRequest(book_id);
    }
}

/**
 * Komponent funkcyjny reprezentujący główny widok katalogu.
 * Zarządza stanem filtrów, sortowania, paginacji oraz synchronizuje dane z serwerem.
 * @component
 * @returns {JSX.Element} Wyrenderowany widok katalogu z panelami bocznymi, filtrami i listą wyników.
 */
function CatalogView(): JSX.Element {
    const auth = useContext(AuthContext);
    const isLibrarian = auth?.session?.access === 'admin';

    /** Zawiera wszystkie filtry możliwe do wybrania */
    const [allFilters, setAllFilters] = useState<BookSearchFilter>({
        author: [],
        genre: [],
        publisher: [],
        // tags: [],
        language: []
    });

    /** Pobieranie wszystkich dostępnych opcji filtrów na starcie, wypełnia `allFilters` danymi */
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const filters = await fetchFiltersRequest();
                setAllFilters(filters);
            } catch (error: any) {
                console.error(error);
                setPopupData({error: error.message})
                setShownPopup("CatalogError")
            }
        };
        void loadOptions();
    }, []);

    /** Pobiera parametry z URL*/
    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearch] = useState<SearchPanelReturn | undefined>(() => {
        const q = searchParams.get("q");
        return q ? { search: q } : undefined;
    });

    /** Lista książek zwróconych przez stronę */
    const [books, setBooks] = useState<Book[]>([]);

    const [currentPage, setCurrentPage] = useState(() => {
        const p = searchParams.get("page");
        return p ? parseInt(p) : 1;
    });

    const [totalPages, setTotalPages] = useState(1);
    const [totalBookCount, setTotalBookCount] = useState(0);

    // Inkrementowany przy naciśnięciu "Wyczyść filtry"
    const [resetToken, setResetToken] = useState(0);

    /** Pobiera dane o filtrach z URL */
    const getFiltersFromUrl = (params: URLSearchParams): BookSearchFilter => {
        const from = params.get("date_from");
        const to = params.get("date_to");
        return {
            author: params.getAll("author"),
            genre: params.getAll("genre"),
            publisher: params.getAll("publisher"),
           /* tags: params.getAll("tags"),*/
            language: params.getAll("language"),
            release_date: (from && to) ? { from: new Date(from), to: new Date(to) } : undefined
        };
    };


    const [activeFilters, setActiveFilters] = useState<BookSearchFilter>(() => getFiltersFromUrl(searchParams));

    const [activeFilterCount, setActiveFilterCount] = useState<number>(0);

    const [sorting, setSorting] = useState<SearchSort>(() => ({
        key: searchParams.get("sort_key") || "title",
        direction: (searchParams.get("sort_dir") as 'ASC' | 'DESC') || "ASC"
    }));

    /** Ref to track if we triggered the URL update (prevents infinite loop with Back button logic) */
    const isUpdatingUrlRef = useRef(false);

    /** Obsługuje wyświetlanie wszystkich Poupuów na stronie*/
    const [shownPopup, setShownPopup] = useState<undefined
        | "rentConfirm" | "rentSuccess" | "rentError"
        | "reserveConfirm" | "reserveSuccess" | "reserveError"
        | "removeBookConfirm" | "removeBookSuccess" | "removeBookError"
        | "addInstanceSuccess" | "addInstanceError"
        | "editBook" | "editBookError" | "editBookSuccess"
        | "instanceMarkDamagedSuccess" | "instanceMarkDamagedError"
        | "instanceMarkMendedSuccess" | "instanceMarkMendedError"
        | "removeInstanceConfirm" | "removeInstanceSuccess" | "removeInstanceError"
        | "instanceDisplayQRCode"| "ScanError" | "CatalogError" | "AccessDeniedError">(undefined);

    interface PopupData {
        book?: Book,
        error?: string,
        instanceId?: number,
        bookId?: number
    }

    const [popupData, setPopupData] = useState<PopupData>({});


    /** Synchronizuje filtry i wyszukiwanie z URL */
    useEffect(() => {
        const params = new URLSearchParams();

        if (search?.search) params.set("q", search.search);
        if (currentPage > 1) params.set("page", currentPage.toString());

        if (sorting.key !== "title" || sorting.direction !== "ASC") {
            params.set("sort_key", sorting.key);
            params.set("sort_dir", sorting.direction);
        }

        activeFilters.author?.forEach(v => params.append("author", v));
        activeFilters.genre?.forEach(v => params.append("genre", v));
        activeFilters.publisher?.forEach(v => params.append("publisher", v));
        // activeFilters.tags?.forEach(v => params.append("tags", v));
        activeFilters.language?.forEach(v => params.append("language", v));

        if (activeFilters.release_date) {
            params.set("date_from", activeFilters.release_date.from.getFullYear().toString());
            params.set("date_to", activeFilters.release_date.to.getFullYear().toString());
        }

        // Only update if actually different to avoid redundant history entries
        if (params.toString() !== searchParams.toString()) {
            isUpdatingUrlRef.current = true;
            setSearchParams(params, { replace: true });
        }

    }, [activeFilters, sorting, search, currentPage, searchParams]);

    /** Obsługuje wczytywanie filtrów z URL. Umożliwia zewnętrzną, nawigacje i cofanie w przeglądarce */
    useEffect(() => {
        if (isUpdatingUrlRef.current) {
            isUpdatingUrlRef.current = false;
            return;
        }

        const newPage = parseInt(searchParams.get("page") || "1");
        const newSearch = searchParams.get("q") ? { search: searchParams.get("q")! } : undefined;
        const newSort: SearchSort = {
            key: searchParams.get("sort_key") || "title",
            direction: (searchParams.get("sort_dir") as 'ASC' | 'DESC') || "ASC"
        };
        const newFilters = getFiltersFromUrl(searchParams);

        setCurrentPage(newPage);
        setSearch(newSearch);
        setSorting(newSort);
        setActiveFilters(newFilters);
    }, [searchParams]);




    /** Aktualizowanie ilości aktywnych filtrów */
    useEffect(() => {
        setActiveFilterCount((
            Math.min(activeFilters.author?.length || 0, 1)
            + Math.min(activeFilters.genre?.length || 0, 1)
            + Math.min(activeFilters.publisher?.length || 0, 1)
            // + Math.min(activeFilters.tags?.length || 0, 1)
            + Math.min(activeFilters.language?.length || 0, 1)
            + (activeFilters.release_date ? 1 : 0)
        ));
    }, [activeFilters]);

    /**
     * Pobieranie nowych wyników wyszukiwania i przewinięcie strony na samą górę
    */
    const fetchBooksAndScrollToTop = useCallback(async () => {
        const searchString = search?.search || "";
        try{
            const result = await fetchCatalogRequest(
                isLibrarian,
                searchString,
                sorting,
                activeFilters,
                currentPage,
            );
            setBooks(result.result);
            setTotalPages(result.totalPages);
            setTotalBookCount(result.totalResults);

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        catch(e: any){
            console.error(e);
            setPopupData({error: e.message})
            setShownPopup("CatalogError")

        }
    }, [activeFilters, currentPage, isLibrarian, search?.search, sorting]);

    /**
     * @event refreshBook odświeża dane po książkach, wywołane po kążdym wydarzeniu wpływającym na dane książki
     * @param {number} book_id
     * */
    const refreshBook = async (book_id: number) => {
        const updatedBook = await fetchBookRequest(isLibrarian, book_id);
        if (updatedBook) {
            setBooks(currentBooks => currentBooks.map(b =>
                b.book_id === book_id ? updatedBook : b
            ));
        }
    }

    /** Pobiera informacje o książkach */
    useEffect(() => {
        (async () => {
            try {
                await fetchBooksAndScrollToTop();
            }
            catch (e: any) {
                setPopupData({error: e.message})
                setShownPopup("CatalogError")
            }
        })()
    }, [activeFilters, sorting, search, currentPage]);


    const handleResetFilters = () => {
        setSearch({ search: "" });
        setResetToken(prev => prev + 1);
        setActiveFilters({
            author: [],
            genre: [],
            publisher: [],
            // tags: [],
            language: [],
            release_date: undefined,
        });
        setCurrentPage(1);
    };

    const notFoundText = ((): string => {
        const hasSearch = search?.search && search.search.trim().length > 0;
        const hasFilters = activeFilterCount > 0;

        if (hasSearch && hasFilters) {
            return `Nie znaleziono książek dla frazy „${search?.search}” przy wybranych filtrach.`;
        }

        if (hasSearch) {
            return `Brak wyników pasujących do frazy „${search?.search}”.`;
        }

        if (hasFilters) {
            return "Żadna książka nie spełnia wybranych kryteriów filtrowania.";
        }

        return "Katalog jest obecnie pusty.";
    })();

    /**
     * @event hidePopups chowa pupup'y praktywnie to samo co handleClosePopup, ale sygnatura jest inna
     * */
    const hidePopups = () => {
        setShownPopup(undefined);
        setPopupData({});
    }

    /**
     * @event handleClosePopup używany w obu wersjach strony, obsługuje zamykanie obecnie otwartego popup'u niezależnej ego typu
     * @param prev
     * */
    const handleClosePopup = (prev: unknown) => {
        setPopupData({})
        if (prev == false) {
            hidePopups();
        }
    }

    /** @event onRentBookScanned wywoływany przy kliknięciu, w guzik skanowania w panelu wyszukiwania.
     * Obsługuje proces wyporzyczania */
    const onRentBookScanned = async (scanned_str: string) => {
        let parsed_data: {instance: number, book: number};
        let book_info: Book;
        try{
            parsed_data = JSON.parse(scanned_str);
            // book_info = await fetchBookRequest(false, parsed_data.book);
        }
        catch(e: any){
            setShownPopup('ScanError')
            setPopupData({error: e.message})
            return;
        }

        setShownPopup("rentConfirm")
        setPopupData({instanceId: parsed_data.instance/*, book: book_info*/});
    }

    const onReserveBookPressed = (book: BookUser) => {
        setShownPopup("reserveConfirm");
        setPopupData({ book: book });
    }

    const onAddInstancePressed = async (book: BookAdmin) => {
        hidePopups();

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("addInstanceError");
            return;
        }
        try {
            await addBookInstanceRequest(book.book_id);
            await refreshBook(book.book_id);
            setPopupData({ book: book });
            setShownPopup("addInstanceSuccess");
            return;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "");
            setPopupData({ book: book, error: msg });
            setShownPopup("addInstanceError");
            return;
        }
    }

    const onEditBookPressed = async (book: BookAdmin) => {
        hidePopups();

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("editBookError");
            return;
        }
        setPopupData({ book: book });
        setShownPopup("editBook");
    }

    const onEditBookFinished = async (book: Book, _copies: number) => {
        hidePopups();

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("editBookError");
            return;
        }
        try {
            await editBookRequest(book);
            await refreshBook(book.book_id);
            setPopupData({ book: book });
            setShownPopup("editBookSuccess");
            return;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "");
            setPopupData({ book: book, error: msg });
            setShownPopup("editBookError");
            return;
        }
    }

    const onRemoveBookPressed = (book: BookAdmin) => {
        setShownPopup("removeBookConfirm");
        setPopupData({ book: book });
    }

    const onInstanceDisplayQRCodePressed = async (book: BookAdmin, instance_id: number) => {
        setPopupData({ book: book, instanceId: instance_id });
        setShownPopup("instanceDisplayQRCode");
    }

    const onInstanceMarkDamagedPressed = async (book: BookAdmin, instance_id: number) => {
        hidePopups();
        try {
            await markDamagedBookInstanceRequest(instance_id);
            if (book.book_id) await refreshBook(book.book_id);
            setPopupData({ book: book, instanceId: instance_id });
            setShownPopup("instanceMarkDamagedSuccess");
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "");
            setPopupData({ book: book, instanceId: instance_id, error: msg });
            setShownPopup("instanceMarkDamagedError");
        }
    }
    /**
     * @event onInstaceMarkMendedPressed wywołuje popup który wywołuje funkcję `handle
     * */
    const onInstanceMarkMendedPressed = async (book: BookAdmin, instance_id: number) => {
        hidePopups();
        try {
            await markMendedBookInstanceRequest(instance_id);
            if (book.book_id) await refreshBook(book.book_id);
            setPopupData({ book: book, instanceId: instance_id });
            setShownPopup("instanceMarkMendedSuccess");
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "");
            setPopupData({ book: book, instanceId: instance_id, error: msg });
            setShownPopup("instanceMarkMendedError");
        }
    }
    
    /**
     * @event onInstanceRemovePressed wywołuje popup, który wywołuje `handleInstanceRemove`
     * @param {BookAdmin} book
     * @param {number} instance_id
     * */
    const onInstanceRemovePressed = (book: BookAdmin, instance_id: number) => {
        setShownPopup("removeInstanceConfirm");
        setPopupData({ book: book, instanceId: instance_id });
    }

    /**
     * @event handleInstanceRemove używany w wersji administratora obsługuje usuwanie kopii książki
     * @prop {PopupData} data
     * */
    const handleInstanceRemove = async (data: PopupData) => {
        hidePopups();

        if (!data.instanceId || !data.book) {
            return;
        }

        try {
            await removeBookInstanceRequest(data.instanceId);
            if (data.book.book_id) await refreshBook(data.book.book_id);
            setPopupData(data);
            setShownPopup("removeInstanceSuccess");
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "");
            setPopupData({ ...data, error: msg });
            setShownPopup("removeInstanceError");
        }
    }


    /**
     * @event handleBookReserve używany w wersji użytkownika obsługuję rezerwacje książki
     * @param {PopupData} data
     * */
    const handleBookReserve = async (data: PopupData) => {
        hidePopups();
        const book = data.book;

        if (!book) {
            return;
        }

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("reserveError");
            return;
        }
        try {
            await reserveBookRequest(book.book_id);
            await refreshBook(book.book_id);
            setPopupData({ book: book });
            setShownPopup("reserveSuccess");
            return;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "");
            setPopupData({ book: book, error: msg });
            setShownPopup("reserveError");
            return;
        }
    }

    /**
     * @event handleBookRent używany w wersji użytkownika obsługuję wypożyczenia książki
     * @param {PopupData} data*/
    const handleBookRent = async (data: PopupData) => {
        if (!data.instanceId) {
            setPopupData({ error: "Nie znaleziono kluczowych informacji przy wypożyczaniu książki" });
            setShownPopup("rentError");
            return;
        }

        try {
            await rentBookRequest(data.instanceId);
            // await refreshBook(book.book_id);
            // setPopupData({ book: book });
            setShownPopup("rentSuccess");
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "");
            setPopupData({ error: msg });
            setShownPopup("rentError");
            console.error(e);
        }
    }

    /**
     * @event handleBookRemove używany w wersji administratora obsługuje usuwanie książek
     * @param {PopupData} data
     * */
    const handleBookRemove = async (data: PopupData) => {
        hidePopups();
        const book = data.book;

        if (!book) {
            return;
        }

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("removeBookError");
            return;
        }
        try {
            await removeBookRequest(book.book_id);
            setPopupData({ book: book });
            setShownPopup("removeBookSuccess");
            await fetchBooksAndScrollToTop();
            return;
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "");
            setPopupData({ book: book, error: msg });
            setShownPopup("removeBookError");
            console.error(e);
            return;
        }
    }

    return <>


       <NavSidebar/>
        <main>
        <h1><img src={catalogIcon} alt="" /> Katalog</h1>
        <div>
            <SearchPanel onSearch={(data: SearchPanelReturn) => { setSearch(data); setCurrentPage(1); }}
                         defaultValue={search?.search ?? ""}
                         scanButtonFunction={onRentBookScanned}>
                <FilterResetButton activeCount={activeFilterCount} onReset={handleResetFilters} />
                <CustomSelect filterKey=""
                              label="Sortuj"
                              initialValues={(() => sorting ? [`${sorting.key}-${sorting.direction})`] : ["title-ASC"])()}
                        onChange={(v: string[]) => {
                            // value w CustomSelect ma format [index]_[ASC|DESC]
                            const val = v[0].split('-');
                            setSorting({ key: val[0], direction: val[1] == "ASC" ? "ASC" : "DESC" })
                        }}>
                    <CustomOption value="title-ASC" key='1'>Tytuł (A-Z)</CustomOption>
                    <CustomOption value="title-DESC" key='2'>Tytuł (Z-A)</CustomOption>
                    <CustomOption value="publish_year-ASC" key='3'>Rok wydania (rosnąco)</CustomOption>
                    <CustomOption value="publish_year-DESC" key='4'>Rok wydania (malejąco)</CustomOption>
                </CustomSelect>

                <CustomSelect filterKey="" label="Autor" searchable allow_multiple
                    key={`author-${resetToken}`}
                    initialValues={activeFilters.author}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, author: v }) }}>
                    {allFilters.author?.map(a => <CustomOption key={a} value={a}>{a}</CustomOption>)}
                </CustomSelect>

                {/*<CustomSelect filterKey="" label="Tagi" searchable allow_multiple
                    key={`tags-${resetToken}`}
                    initialValues={activeFilters.tags}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, tags: v }) }}>
                    {allFilters.tags?.map(t => <CustomOption key={t} value={t}>{t}</CustomOption>)}
                </CustomSelect>*/}

                <CustomSelect filterKey="" label="Gatunek" searchable allow_multiple
                    key={`genre-${resetToken}`}
                    initialValues={activeFilters.genre}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, genre: v }) }}>
                    {allFilters.genre?.map(g => <CustomOption key={g} value={g}>{g}</CustomOption>)}
                </CustomSelect>

                <CustomSelect filterKey="" label="Wydawca" searchable allow_multiple
                    key={`publisher-${resetToken}`}
                    initialValues={activeFilters.publisher}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, publisher: v }) }}>
                    {allFilters.publisher?.map(p => <CustomOption key={p} value={p}>{p}</CustomOption>)}
                </CustomSelect>

                <CustomSelect filterKey="" label="Język" searchable allow_multiple
                    key={`language-${resetToken}`}
                    initialValues={activeFilters.language}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, language: v }) }}>
                    {allFilters.language?.map(p => <CustomOption key={p} value={p}>{p}</CustomOption>)}
                </CustomSelect>


                <CustomSelect filterKey="" label="Data wydania" allowCustomRange
                    initialValues={(() => {
                        const from = activeFilters.release_date?.from.getFullYear();
                        const to = activeFilters.release_date?.to.getFullYear();
                        if (from && to) {
                            return [from.toString() + " - " + to.toString()];
                        }
                    })()}
                    key={`release_date-${resetToken}`}
                    onChange={(v: string[]) => {
                        const [from, to] = v[0].split('-').map(year => new Date(Number(year), 0, 1));
                        setActiveFilters({
                            ...activeFilters,
                            release_date: { from, to }
                        });
                    }}>
                    <CustomOption value="release_date:custom">Zakres</CustomOption>
                </CustomSelect>
            </SearchPanel>

            <div className="books">
                {books && books.length === 0 && (
                    <div className="text-center">
                        <h3 className="mt-8 mb-3">{notFoundText}</h3>
                        <a onClick={handleResetFilters}>Pokaż cały katalog</a>
                    </div>
                )}
                {!isLibrarian && books && books.map((book, index) => (
                    <UserBookComponent
                        book_info={book as BookUser} key={book.book_id || index}
                        onReserveBookPressed={onReserveBookPressed}
                    />
                ))}
                {isLibrarian && books && books.map((book, index) => (
                    <AdminBookComponent
                        book_info={book as BookAdmin} key={book.book_id || index}
                        onAddInstancePressed={(b: BookAdmin) => void onAddInstancePressed(b)}
                        onEditBookPressed={(b: BookAdmin) => void onEditBookPressed(b)}
                        onRemoveBookPressed={(b: BookAdmin) => void onRemoveBookPressed(b)}
                        onInstanceDisplayQRCodePressed={(b: BookAdmin, ins: number) => void onInstanceDisplayQRCodePressed(b, ins)}
                        onInstanceMarkDamagedPressed={(b: BookAdmin, ins: number) => void onInstanceMarkDamagedPressed(b, ins)}
                        onInstanceMarkMendedPressed={(b: BookAdmin, ins: number) => void onInstanceMarkMendedPressed(b, ins)}
                        onInstanceRemovePressed={(b: BookAdmin, ins: number) => void onInstanceRemovePressed(b, ins)}
                    />
                ))}
            </div>

            {books && books.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page: number) => { setCurrentPage(page);  }}
                />
            )}
        </div>
        </main>
        <InstanceQR isOpen={shownPopup === "instanceDisplayQRCode"}
                    setIsOpen={handleClosePopup}
                    instance_id={popupData.instanceId ?? 0}
                    book_title={popupData.book?.title ?? "[Nie znaleziono tytułu]"}/>

        <Alert message={"Błąd przy skanowaniu kodu"}
               title={popupData.error ?? "Błąd skanowania książki"}
               isOpen={shownPopup === "ScanError"}
               setIsOpen={handleClosePopup}/>
        <Alert message={popupData?.error ?? ""}
               title="Błąd przy wczytaniu katalogu"
               isOpen={shownPopup === 'CatalogError'}
               setIsOpen={handleClosePopup}/>
        <Alert message="Katalog nie był możliwy do wczytania przez poziom dostępu użytkownika, spróbuj zalogować się ponownie lub spróbuj ponownie później."
               title="Odmowa dostępu"
               isOpen={shownPopup === 'AccessDeniedError'}
               setIsOpen={handleClosePopup}

               onAccept={ () => {
                   auth?.logout();
                   window.location.reload();
               }}
               acceptText="Wyloguj"
               cancelText="Pozostań na stronie"/>

        <Alert message='Czy na pewno chcesz wyporzyczyć tą książkę?'
               title="Potwierdź wyporzyczenie książki"
               isOpen={shownPopup === "rentConfirm"}
               setIsOpen={handleClosePopup}
               onAccept={() => handleBookRent(popupData)}/>

        <Alert isOpen={shownPopup === "rentError"}
               setIsOpen={handleClosePopup}
               title="Błąd Wyporzyczenia"
               icon={iconError}
               message={`Nie udało się wypożyczyć książki: ${popupData?.error}`}
        />

        <Popup isOpen={shownPopup === "rentSuccess"} setIsOpen={handleClosePopup} title="Książka wypożyczona" onClose={hidePopups}>
            <p className="text-justify">
                Pomyślnie wypożyczono książkę.
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "reserveConfirm"} setIsOpen={handleClosePopup} title="Potwierdzenie rezerwacji" onClose={hidePopups}>
            <p className="text-justify">
                Czy na pewno chcesz zarezerwować książkę <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>?
            </p>
            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Nie</button>
                <button onClick={() => void handleBookReserve(popupData)}>Tak, zarezerwuj</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "reserveError"} setIsOpen={handleClosePopup} title="Błąd rezerwacji" icon={iconError} onClose={hidePopups}>
            <p className="text-justify">
                Nie udało się zarezerwować książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>
            <p className="text-justify italic">
                <strong>{popupData?.error}</strong>
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "reserveSuccess"} setIsOpen={handleClosePopup} title="Potwierdzenie rezerwacji" onClose={hidePopups}>
            <p className="text-justify">
                Dziękujemy za rezerwację książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "removeBookConfirm"} setIsOpen={handleClosePopup} title="Usuwanie książki" onClose={hidePopups}>
            <p className="text-justify">
                Czy na pewno chcesz trwale usunąć książkę <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>
            <p><strong>
                Tej operacji nie można cofnąć.
            </strong></p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Anuluj</button>
                <button onClick={() => void handleBookRemove(popupData)} className="bg-red-700 hover:bg-red-600">Usuń trwale</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "removeBookSuccess"} setIsOpen={handleClosePopup} title="Usunięto książkę" onClose={hidePopups}>
            <p className="text-justify">
                Pomyślnie usunięto książkę <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong> z systemu.
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "removeBookError"} setIsOpen={handleClosePopup} title="Błąd przy usuwaniu książki" onClose={hidePopups}>
            <p className="text-justify">
                Nie udało się usunąć książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>
            <p className="text-justify italic">
                <strong>{popupData?.error}</strong>
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "addInstanceSuccess"} setIsOpen={handleClosePopup} title="Dodano egzemplarz" onClose={hidePopups}>
            <p className="text-justify">
                Pomyślnie dodano egzemplarz książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "addInstanceError"} setIsOpen={handleClosePopup} title="Błąd przy dodawaniu egzemplarza" onClose={hidePopups}>
            <p className="text-justify">
                Nie udało się dodać egzemplarza książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>
            <p className="text-justify italic">
                <strong>{popupData?.error}</strong>
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "editBook"} setIsOpen={handleClosePopup} title="Edytuj książkę" onClose={hidePopups}>
            <AddBookForm info={popupData?.book} mode="edit" close={hidePopups} onSubmit={onEditBookFinished}/>
        </Popup>

        <Popup isOpen={shownPopup === "editBookError"} setIsOpen={handleClosePopup} title="Błąd przy edycji książki" onClose={hidePopups}>
            <p className="text-justify">
                Nie udało się edytować książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>
            <p className="text-justify italic">
                <strong>{popupData?.error}</strong>
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "editBookSuccess"} setIsOpen={handleClosePopup} title="Edycja udana" onClose={hidePopups}>
            <p className="text-justify">
                Pomyślnie edytowano książkę <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
                Zmiany zostały zapisane.
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "instanceMarkDamagedSuccess"} setIsOpen={handleClosePopup} title="Zmieniono stan egzemplarza" onClose={hidePopups}>
            <p className="text-justify">
                Pomyślnie oznaczono jako zniszczony egzemplarz książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "instanceMarkDamagedError"} setIsOpen={handleClosePopup} title="Błąd przy zmianie stanu" onClose={hidePopups}>
            <p className="text-justify">
                Nie udało się oznaczyć jako zniszczony egzemplarza książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>
            <p className="text-justify italic">
                <strong>{popupData?.error}</strong>
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "instanceMarkMendedSuccess"} setIsOpen={handleClosePopup} title="Zmieniono stan egzemplarza" onClose={hidePopups}>
            <p className="text-justify">
                Pomyślnie anulowano zniszczenie egzemplarza książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "instanceMarkMendedError"} setIsOpen={handleClosePopup} title="Błąd przy zmianie stanu" onClose={hidePopups}>
            <p className="text-justify">
                Nie udało się anulować zniszczenia egzemplarza książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>
            <p className="text-justify italic">
                <strong>{popupData?.error}</strong>
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "removeInstanceConfirm"} setIsOpen={handleClosePopup} title="Usuwanie egzemplarza" onClose={hidePopups}>
            <p className="text-justify">
                Czy na pewno chcesz trwale usunąć egzemplarz książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>
            <p><strong>
                Tej operacji nie można cofnąć.
            </strong></p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Anuluj</button>
                <button onClick={() => void handleInstanceRemove(popupData)} className="bg-red-700 hover:bg-red-600">Usuń trwale</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "removeInstanceSuccess"} setIsOpen={handleClosePopup} title="Usunięto egzemplarz" onClose={hidePopups}>
            <p className="text-justify">
                Pomyślnie usunięto egzemplarz książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong> z systemu.
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>

        <Popup isOpen={shownPopup === "removeInstanceError"} setIsOpen={handleClosePopup} title="Błąd przy usuwaniu egzemplarza" onClose={hidePopups}>
            <p className="text-justify">
                Nie udało się usunąć egzemplarza książki <strong className="whitespace-nowrap">„{popupData?.book?.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData?.book?.authors?.join(", ")}</strong>.
            </p>
            <p className="text-justify italic">
                <strong>{popupData?.error}</strong>
            </p>

            <div className="flex flex-row *:flex-1 mt-6">
                <button onClick={hidePopups} className="boring">Zamknij</button>
            </div>
        </Popup>
    </>
}

export default CatalogView;