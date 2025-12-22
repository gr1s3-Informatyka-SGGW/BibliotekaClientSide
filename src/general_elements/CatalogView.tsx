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
 * * @author Aleksander Grzegrzułka
 */

import { useContext, useEffect, useState, type JSX } from "react";
import { type BookSearchFilter, type SearchSort, type CatalogResponse, type Book, type BookUser, type BookAdmin } from "../../public/server_types";
import AdminBookComponent from "../elements_admin/AdminBookComponent";
import "./catalog.css";
import "../style.css";
import '../input.css';
import NavSidebar from "./NavSidebar";
import SearchPanel, { type SearchPanelReturn } from "./SearchPanel";
import UserBookComponent from "../elements_user/UserBookComponent";
import {
    fetchAdminCatalogRequest,
    fetchUserCatalogRequest,
    fetchAuthors,
    fetchGenres,
    fetchTags,
    fetchPublishers,
    fetchLanguages,
    reserveBookRequest,
    rentBookRequest,
    addBookInstanceRequest,
    removeBookRequest,
    editBookRequest
} from "../../public/server_requests.ts";
import catalogIcon from "../assets/newsstand.svg"
import { AuthContext } from "../../public/UserAuth";
import { CustomSelect, CustomOption, FilterResetButton } from "../../public/custom_components/CustomSelect.tsx";
import { Pagination } from "../general_elements/Pagination.tsx";
import Popup from "../../public/custom_components/Popup.tsx";
import iconError from "../assets/error.svg"

/**
 * Wykonuje żądanie do API w celu pobrania listy książek na podstawie parametrów wyszukiwania.
 * * @param {boolean} isLibrarian - Flaga określająca, czy pobrać dane z punktu końcowego dla administratora.
 * @param {string} search_bar - Fraza wpisana w wyszukiwarkę.
 * @param {SearchSort} [sort] - Obiekt definiujący klucz i kierunek sortowania.
 * @param {BookSearchFilter} [filter] - Obiekt zawierający wybrane kategorie filtrów.
 * @param {number} [page=1] - Numer żądanej strony wyników.
 * @returns { Promise<CatalogResponse<Book>>} Obiekt z listą książek oraz liczbą wszystkich stron i książek.
 */
const fetchCatalogRequest = (isLibrarian: boolean, search_bar: string, sort?: SearchSort, filter?: BookSearchFilter, page: number = 1):
    Promise<CatalogResponse<Book>> => {
    try {
        if (isLibrarian) {
            return fetchAdminCatalogRequest(search_bar, sort, filter, page);
        } else {
            return fetchUserCatalogRequest(search_bar, sort, filter, page);
        }
    } catch {
        return Promise.resolve(
            { books: [], totalPages: 0, totalBooks: 0 }
        )
    }
}

/**
 * Komponent funkcyjny reprezentujący główny widok katalogu.
 * Zarządza stanem filtrów, sortowania, paginacji oraz synchronizuje dane z serwerem.
 * * @component
 * @returns {JSX.Element} Wyrenderowany widok katalogu z panelami bocznymi, filtrami i listą wyników.
 */
function CatalogView(): JSX.Element {
    const auth = useContext(AuthContext);
    const isLibrarian = auth?.session?.access === 'admin';

    const [search, setSearch] = useState<SearchPanelReturn | undefined>(undefined);
    const [books, setBooks] = useState<Book[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalBookCount, setTotalBookCount] = useState(0);

    // Inkrementowany przy naciśnięciu "Wyczyść filtry"
    const [resetToken, setResetToken] = useState(0);

    const [allFilters, setAllFilters] = useState<BookSearchFilter>({
        author: [] as string[],
        genre: [] as string[],
        publisher: [] as string[],
        tags: [] as string[],
        language: [] as string[]
    });

    const [activeFilters, setActiveFilters] = useState<BookSearchFilter>({
        author: [] as string[],
        genre: [] as string[],
        publisher: [] as string[],
        tags: [] as string[],
        language: [] as string[],
        release_date: undefined
    });

    const [activeFilterCount, setActiveFilterCount] = useState<number>(0);

    const [sorting, setSorting] = useState<SearchSort>({
        key: "title",
        direction: "ASC"
    });

    const [shownPopup, setShownPopup] = useState<undefined
        | "rentConfirm" | "rentSuccess" | "rentError"
        | "reserveConfirm" | "reserveSuccess" | "reserveError"
        | "removeBookConfirm" | "removeBookSuccess" | "removeBookError"
        | "addInstanceSuccess" | "addInstanceError"
        | "editBook" | "editBookError">(undefined);

    const [popupData, setPopupData] = useState<any>(undefined);

    // Pobieranie wszystkich dostępnych filtrów na starcie
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [author, genre, tags, publisher, language] = await Promise.all([
                    fetchAuthors(), fetchGenres(), fetchTags(), fetchPublishers(), fetchLanguages()
                ]);
                setAllFilters({ author, genre, tags, publisher, language });
            } catch (error) {
                console.error("Błąd ładowania filtrów:", error);
            }
        };
        loadOptions();
    }, []);

    // Reakcja na zmianę filtrów (resetuje stronę na 1)
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilters, sorting]);

    // Aktualizowanie ilości aktywnych filtrów
    useEffect(() => {
        setActiveFilterCount((
            Math.min(activeFilters.author?.length || 0, 1)
            + Math.min(activeFilters.genre?.length || 0, 1)
            + Math.min(activeFilters.publisher?.length || 0, 1)
            + Math.min(activeFilters.tags?.length || 0, 1)
            + Math.min(activeFilters.language?.length || 0, 1)
            + (activeFilters.release_date ? 1 : 0)
        ));
    }, [activeFilters]);

    // Pobieranie nowych wyników wyszukiwania i przewinięcie strony na samą górę
    useEffect(() => {
        (async () => {
            const searchString = search?.search || "";
            console.log(`Wyszukiwanie ${searchString} na stronie ${currentPage}\n
                Sortowanie: ${sorting.key}_${sorting.direction}\n
                Filtry    : ${JSON.stringify(activeFilters)}`);
            const result = await fetchCatalogRequest(
                isLibrarian,
                searchString,
                sorting,
                activeFilters,
                currentPage,
            );

            setBooks(result.books);
            setTotalPages(result.totalPages);
            setTotalBookCount(result.totalBooks);
        })()

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [activeFilters, sorting, search, currentPage]);

    const handleResetFilters = () => {
        setSearch({ search: "" });
        setResetToken(prev => prev + 1);
        setActiveFilters({
            author: [],
            genre: [],
            publisher: [],
            tags: [],
            language: [],
            release_date: undefined,
        });
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

    const onRentBookPressed = (book: BookUser) => {
        setShownPopup("rentConfirm");
        setPopupData(book);
    }

    const onReserveBookPressed = (book: BookUser) => {
        setShownPopup("reserveConfirm");
        setPopupData(book);
    }

    const onAddInstancePressed = (book: BookAdmin) => {
        hidePopups();

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("addInstanceError");
            return;
        }
        try {
            reserveBookRequest(book.book_id);
            setPopupData(book);
            setShownPopup("addInstanceSuccess");
            return;
        } catch (e) {
            const msg = (e && Object.prototype.hasOwnProperty.call(e, "message")) ? (e as any).message : "";
            setPopupData({ book: book, error: msg });
            setShownPopup("addInstanceError");
            return;
        }
    }

    const onEditBookPressed = (book: BookAdmin) => {
        hidePopups();

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("editBookError");
            return;
        }
        try {
            editBookRequest(book);
            setPopupData(book);
            setShownPopup("editBook");
            return;
        } catch (e) {
            const msg = (e && Object.prototype.hasOwnProperty.call(e, "message")) ? (e as any).message : "";
            setPopupData({ book: book, error: msg });
            setShownPopup("editBookError");
            return;
        }
    }

    const onRemoveBookPressed = (book: BookAdmin) => {
        setShownPopup("removeBookConfirm");
        setPopupData(book);
    }

    const hidePopups = () => {
        setShownPopup(undefined);
        setPopupData(undefined);
    }

    const handleBookReserve = (book: BookUser) => {
        hidePopups();

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("reserveError");
            return;
        }
        try {
            reserveBookRequest(book.book_id);
            setPopupData(book);
            setShownPopup("reserveSuccess");
            return;
        } catch (e) {
            const msg = (e && Object.prototype.hasOwnProperty.call(e, "message")) ? (e as any).message : "";
            setPopupData({ book: book, error: msg });
            setShownPopup("reserveError");
            return;
        }
    }

    const handleBookRent = (book: BookUser) => {
        hidePopups();

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("rentError");
            return;
        }

        try {
            rentBookRequest(book.book_id);
            setPopupData(book);
            setShownPopup("rentSuccess");
            return;
        } catch (e) {
            const msg = (e && Object.prototype.hasOwnProperty.call(e, "message")) ? (e as any).message : "";
            setPopupData({ book: book, error: msg });
            setShownPopup("rentError");
            return;
        }
    }

    const handleBookRemove = (book: BookAdmin) => {
        hidePopups();

        if (!book.book_id) {
            setPopupData({ book: book, error: "Pole book_id jest undefined" });
            setShownPopup("removeBookError");
            return;
        }
        try {
            removeBookRequest(book.book_id);
            setPopupData(book);
            setShownPopup("removeBookSuccess");
            return;
        } catch (e) {
            const msg = (e && Object.prototype.hasOwnProperty.call(e, "message")) ? (e as any).message : "";
            setPopupData({ book: book, error: msg });
            setShownPopup("removeBookError");
            return;
        }
    }

    return <>
        {shownPopup === "rentConfirm" &&
            <Popup title="Potwierdzenie wypożyczenia" onClose={hidePopups}>
                <p className="text-justify">Czy na pewno chcesz wypożyczyć książkę <strong className="whitespace-nowrap">„{popupData.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.authors.join(", ")}</strong>?</p>
                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Nie</button>
                    <button onClick={() => { handleBookRent(popupData) }}>Tak, wypożycz</button>
                </div>
            </Popup>
        }
        {shownPopup === "rentError" &&
            <Popup title="Błąd wypożyczenia" icon={iconError} onClose={hidePopups}>
                <p className="text-justify">
                    Nie udało się wypożyczyć książki <strong className="whitespace-nowrap">„{popupData.book.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.book.authors.join(", ")}</strong>.
                </p>
                <p className="text-justify italic">
                    <strong>{popupData.error}</strong>
                </p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>
        }
        {shownPopup === "rentSuccess" &&
            <Popup title="Książka wypożyczona" onClose={hidePopups}>
                <p className="text-justify">
                    Pomyślnie wypożyczono książkę <strong className="whitespace-nowrap">„{popupData.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.authors.join(", ")}</strong>.
                </p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>
        }
        {shownPopup === "reserveConfirm" &&
            <Popup title="Potwierdzenie rezerwacji" onClose={hidePopups}>
                <p className="text-justify">
                    Czy na pewno chcesz zarezerwować książkę <strong className="whitespace-nowrap">„{popupData.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.authors.join(", ")}</strong>?
                </p>
                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Nie</button>
                    <button onClick={() => { handleBookReserve(popupData) }}>Tak, zarezerwuj</button>
                </div>
            </Popup>
        }
        {shownPopup === "reserveError" &&
            <Popup title="Błąd rezerwacji" icon={iconError} onClose={hidePopups}>
                <p className="text-justify">
                    Nie udało się zarezerwować książki <strong className="whitespace-nowrap">„{popupData.book.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.book.authors.join(", ")}</strong>.
                </p>
                <p className="text-justify italic">
                    <strong>{popupData.error}</strong>
                </p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>
        }
        {shownPopup === "reserveSuccess" &&
            <Popup title="Potwierdzenie rezerwacji" onClose={hidePopups}>
                <p className="text-justify">
                    Dziękujemy za rezerwację książki <strong className="whitespace-nowrap">„{popupData.book.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.book.authors.join(", ")}</strong>.
                </p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>
        }
        {shownPopup === "removeBookConfirm" &&
            <Popup title="Usuwanie książki" onClose={hidePopups}>
                <p className="text-justify">
                    Czy na pewno chcesz trwale usunąć książkę <strong className="whitespace-nowrap">„{popupData.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.authors.join(", ")}</strong>.
                </p>
                <p><strong>
                    Tej operacji nie można cofnąć.
                </strong></p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Anuluj</button>
                    <button onClick={() => { handleBookRemove(popupData); }} className="bg-red-700 hover:bg-red-600">Usuń trwale</button>
                </div>
            </Popup>
        }
        {shownPopup === "removeBookSuccess" &&
            <Popup title="Usunięto książkę" onClose={hidePopups}>
                <p className="text-justify">
                    Pomyślnie usunięto książkę <strong className="whitespace-nowrap">„{popupData.book.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.book.authors.join(", ")}</strong> z systemu.
                </p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>
        }
        {shownPopup === "removeBookError" &&
            <Popup title="Błąd przy usuwaniu książki" onClose={hidePopups}>
                <p className="text-justify">
                    Nie udało się usunąć książki <strong className="whitespace-nowrap">„{popupData.book.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.book.authors.join(", ")}</strong>.
                </p>
                <p className="text-justify italic">
                    <strong>{popupData.error}</strong>
                </p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>
        }
        {shownPopup === "addInstanceSuccess" &&
            <Popup title="Dodano egzemplarz" onClose={hidePopups}>
                <p className="text-justify">
                    Pomyślnie dodano egzemplarz książki <strong className="whitespace-nowrap">„{popupData.book.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.book.authors.join(", ")}</strong>.
                </p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>
        }
        {shownPopup === "addInstanceError" &&
            <Popup title="Błąd przy dodawaniu egzemplarza" onClose={hidePopups}>
                <p className="text-justify">
                    Nie udało się dodać egzemplarza książki <strong className="whitespace-nowrap">„{popupData.book.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.book.authors.join(", ")}</strong>.
                </p>
                <p className="text-justify italic">
                    <strong>{popupData.error}</strong>
                </p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>
        }
        {shownPopup === "editBook" &&
            <></>
        }
        {shownPopup === "editBookError" &&
            <Popup title="Błąd przy edycji książki" onClose={hidePopups}>
                <p className="text-justify">
                    Nie udało się dodać edytować książki <strong className="whitespace-nowrap">„{popupData.book.title}”</strong> autorstwa <strong className="whitespace-nowrap">{popupData.book.authors.join(", ")}</strong>.
                </p>
                <p className="text-justify italic">
                    <strong>{popupData.error}</strong>
                </p>

                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>
        }

        <h1 className="mb-14"><img src={catalogIcon} alt="icon" /> Katalog</h1>
        <main>
            <NavSidebar></NavSidebar>
            <SearchPanel onSearch={(data: SearchPanelReturn) => { setSearch(data); }}>
                <FilterResetButton activeCount={activeFilterCount} onReset={handleResetFilters} />

                <CustomSelect label="Sortuj" initialValues={["Tytuł (A-Z)"]}
                    onChange={(v: string[]) => {
                        switch (v[0]) {
                            case "Tytuł (A-Z)": {
                                setSorting({ key: "title", direction: "ASC" });
                                return;
                            }
                            case "Tytuł (Z-A)": {
                                setSorting({ key: "title", direction: "DESC" });
                                return;
                            }
                            case "Rok wydania (rosnąco)": {
                                setSorting({ key: "publish_year", direction: "ASC" });
                                return;
                            }
                            case "Rok wydania (malejąco)": {
                                setSorting({ key: "publish_year", direction: "DESC" });
                                return;
                            } default: {
                                throw Error(`Nieznany tryb sortowania ${v[0]}`);
                                return;
                            }
                        }
                    }}>
                    <CustomOption value="Tytuł (A-Z)">Tytuł (A-Z)</CustomOption>
                    <CustomOption value="Tytuł (Z-A)">Tytuł (Z-A)</CustomOption>
                    <CustomOption value="Rok wydania (rosnąco)">Rok wydania (rosnąco)</CustomOption>
                    <CustomOption value="Rok wydania (malejąco)">Rok wydania (malejąco)</CustomOption>
                </CustomSelect>

                <CustomSelect label="Autor" searchable allow_multiple
                    key={`author-${resetToken}`}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, author: v }) }}>
                    {allFilters.author?.map(a => <CustomOption key={a} value={a}>{a}</CustomOption>)}
                </CustomSelect>

                <CustomSelect label="Tagi" searchable allow_multiple
                    key={`tags-${resetToken}`}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, tags: v }) }}>
                    {allFilters.tags?.map(t => <CustomOption key={t} value={t}>{t}</CustomOption>)}
                </CustomSelect>

                <CustomSelect label="Gatunek" searchable allow_multiple
                    key={`genre-${resetToken}`}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, genre: v }) }}>
                    {allFilters.genre?.map(g => <CustomOption key={g} value={g}>{g}</CustomOption>)}
                </CustomSelect>

                <CustomSelect label="Wydawca" searchable allow_multiple
                    key={`publisher-${resetToken}`}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, publisher: v }) }}>
                    {allFilters.publisher?.map(p => <CustomOption key={p} value={p}>{p}</CustomOption>)}
                </CustomSelect>

                <CustomSelect label="Język" searchable allow_multiple
                    key={`language-${resetToken}`}
                    onChange={(v: string[]) => { setActiveFilters({ ...activeFilters, language: v }) }}>
                    {allFilters.language?.map(p => <CustomOption key={p} value={p}>{p}</CustomOption>)}
                </CustomSelect>

                <CustomSelect label="Data wydania" allowCustomRange
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
                {books.length === 0 && (
                    <div className="text-center">
                        <h3 className="mt-8 mb-3">{notFoundText}</h3>
                        <a onClick={handleResetFilters}>Pokaż cały katalog</a>
                    </div>
                )}
                {!isLibrarian && books.map((book, index) => (
                    <UserBookComponent
                        book_info={book as BookUser} key={book.book_id || index}
                        onRentBookPressed={onRentBookPressed}
                        onReserveBookPressed={onReserveBookPressed}
                    />
                ))}
                {isLibrarian && books.map((book, index) => (
                    <AdminBookComponent
                        book_info={book as BookAdmin} key={book.book_id || index}
                        onAddInstancePressed={onAddInstancePressed}
                        onEditBookPressed={onEditBookPressed}
                        onRemoveBookPressed={onRemoveBookPressed}
                    />
                ))}
            </div>

            {books.length > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page: number) => { setCurrentPage(page); }}
                />
            )}
        </main>
    </>
}

export default CatalogView;