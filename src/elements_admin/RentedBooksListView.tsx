/**
 * Plik implementujący widok strony /rented-books dla administratora.
 * Umożliwiająca zarządzanie i przeglądanie wypożyczeń, przy łądowaniu odczytuje dane z linku przesłane metodą "GET" i wczytuje z nich filtrowanie i sortowanie wyników
 * @author Karol Dziuba
 * */

import type { Book, User, RentFullInfo } from "../../public/server_types.ts";
import { extendRentRequest, fetchRentLog, returnBookRequest } from "../../public/server_requests.ts";
import CustomTooltip from "../../public/custom_components/CustomTooltip.tsx";
import React, { useState, useEffect, useCallback } from "react";
import NavSidebar from "../general_elements/NavSidebar.tsx";
import SearchPanel, { type SearchPanelReturn } from "../general_elements/SearchPanel.tsx";
import { Pagination } from "../general_elements/Pagination.tsx";
import { CustomSelect, CustomOption, FilterResetButton } from "../../public/custom_components/CustomSelect.tsx";
import Popup, { Alert } from "../../public/custom_components/Popup.tsx";
import './RentedBookListView.css';
import '../style.css'
import '../input.css'

import bookIcon from '../../src/assets/book.svg';
import userIcon from '../../src/assets/mail.svg';
import calendarIcon from '../../src/assets/calendar.svg';
import errorIcon from '../../src/assets/error.svg';
import checkIcon from '../../src/assets/check.svg';
import scheduleIcon from '../../src/assets/schedule.svg';
import refreshIcon from '../../src/assets/refresh.svg';
import returnsIcon from '../../src/assets/returns.svg';
import borrowIcon from '../../src/assets/borrow.svg';

/**
 * Określa maksymalną liczbę wpisów wypożyczonych książek wyświetlanych na jednej stronie
 * w widoku stronicowania.
 *
 * @constant
 * @type {number}
 */

const ITEMS_PER_PAGE: number = 3;

/**
 * Reprezentuje szczegółowe informacje dotyczące transakcji wypożyczenia książki.
 * Rozszerza podstawowy typ serwerowy RentFullInfo o pola obliczane po stronie klienta.
 *
 * - Server `return_to_date` (Deadline) -> UI `return_date`
 * - Server `return_date` (Faktyczny zwrot) -> UI `actualReturnDate`
 *
 * @interface ExtendedRentInfo
 * @extends {Omit<RentFullInfo, 'borrow_date' | 'return_date' | 'return_to_date' | 'status'>}
 * @property {number} id - Unikalny identyfikator wypożyczenia.
 * @property {Date} borrow_date - Data i czas rozpoczęcia wypożyczenia.
 * @property {Date} return_date - Planowany termin zwrotu książki (data wymagalności).
 * @property {'active' | 'returned_pending'} status - Status wypożyczenia.
 * @property {number} fineAmount - Kwota naliczonej kary (np. 0, jeśli brak opóźnień).
 * @property {Date} [actualReturnDate] - Rzeczywista data zwrotu książki.
 */

export interface ExtendedRentInfo extends Omit<RentFullInfo, 'borrow_date' | 'return_date' | 'return_to_date'> {
    id: number; // <--- NAPRAWIONO: Dodano brakujące pole ID
    borrow_date: Date;
    return_date: Date; // To jest DEADLINE (return_to_date z serwera)
    status: 'active' | 'returned_pending';
    fineAmount: number;
    actualReturnDate?: Date; // To jest FAKTYCZNY ZWROT (return_date z serwera)
}

/**
 * Właściwości (props) przekazywane do komponentu widoku listy wypożyczonych książek.
 *
 * @interface RentedBooksListViewProps
 * @property {ExtendedRentInfo[]} [initialData] - Opcjonalny zestaw danych początkowych dla widoku.
 * Przydatny przy testowaniu, renderowaniu po stronie serwera.
 * Jeśli nie zostanie podany, komponent samodzielnie pobierze dane z serwera po zamontowaniu.
 */

interface RentedBooksListViewProps {
    initialData?: ExtendedRentInfo[];
}

/**
 * Komponent widoku /rented-books.
 * Służy do zarządzania procesem wypożyczeń, oferując wgląd w listę, filtrowanie oraz akcje na rekordach.
 *
 * @returns {React.JSX.Element} Pełny widok strony zarządzania wypożyczeniami.
 *
 * @requires NavSidebar - Element nawigacyjny aplikacji (panel boczny).
 * @requires SearchPanel - Panel obsługujący logikę wyszukiwania i kontener filtrów.
 * @requires CustomSelect - Komponent wyboru, umożliwiający filtrowanie (np. po statusie) i sortowanie wyników.
 * @requires FilterResetButton - Przycisk do szybkiego resetowania wszystkich aktywnych filtrów.
 * @requires Pagination - Komponent stronicowania, umożliwiający nawigację po podzielonych wynikach.
 * @requires Popup - Okna modalne wyświetlające szczegóły użytkownika lub książki.
 * @requires Alert - Okno dialogowe do potwierdzania krytycznych akcji (zwrot, przedłużenie).
 */
export default function RentedBooksListView({ initialData }: RentedBooksListViewProps): React.JSX.Element {

    /** Lista aktualnie przetworzonych i wyświetlanych wypożyczeń. */
    const [rents, setRents] = useState<ExtendedRentInfo[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState("");
    /** Przechowuje surowe wartości filtrów do zapytań API/logiki. */
    const [filters, setFilters] = useState<any>({});

    const [isLoading, setIsLoading] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
    const [isBookPopupOpen, setIsBookPopupOpen] = useState(false);

    /** * Konfiguracja globalnego alertu (potwierdzenia akcji).
     * Używana zarówno do potwierdzania przedłużenia, jak i zwrotu książki, oraz wyświetlania błędów.
     */
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onAccept?: () => void;
        type?: 'prolong' | 'return' | 'error';
    }>({ isOpen: false, title: "", message: "" });

    /** Przechowuje stan aktywnych filtrów w UI (dla komponentów Select). */
    const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});

    /**
     * Przetwarza surowe dane na ujednolicony format `ExtendedRentInfo`.
     * Dostosowane do struktury gdzie `return_to_date` to deadline, a `return_date` to faktyczny zwrot.
     *
     * @param {any} rawData - Surowe dane wejściowe (tablica lub obiekt z polem `items`).
     * @returns {ExtendedRentInfo[]} Lista sformatowanych obiektów wypożyczeń.
     */
    const processApiData = (rawData: any): ExtendedRentInfo[] => {
        const dataArray = Array.isArray(rawData) ? rawData : (rawData?.items || []);

        return dataArray.map((item: any) => {
            const borrowDate = new Date(item.borrow_date);

            const deadlineDate = new Date(item.return_to_date);

            const actualReturnDate = item.return_date ? new Date(item.return_date) : undefined;

            const now = new Date();

            let status: ExtendedRentInfo['status'] = 'active';
            let calculatedFine = 0;

            if (actualReturnDate) {
                status = 'returned_pending';

                if (actualReturnDate > deadlineDate) {
                    const daysOver = Math.ceil((actualReturnDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
                    calculatedFine = daysOver * 10;
                }
            } else {
                if (now > deadlineDate) {
                    const daysOver = Math.ceil((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
                    calculatedFine = daysOver * 10;
                }
            }

            return {
                ...item,
                id: item.id || item.rent_id,
                user: item.user,
                book: item.book,
                borrow_date: borrowDate,
                return_date: deadlineDate,
                status: status,
                fineAmount: item.fineAmount || calculatedFine,
                actualReturnDate: actualReturnDate
            };
        });
    };

    /**
     * Asynchroniczna funkcja odświeżająca dane w widoku.
     * * Działa w dwóch trybach:
     * 1. **Tryb lokalny (gdy `initialData` jest dostępne):** Filtruje i sortuje dostarczoną tablicę po stronie klienta.
     * 2. **Tryb serwerowy:** Wysyła zapytanie do API (`fetchRentLog`) z parametrami wyszukiwania i filtrowania.
     * * Wywoływana przy zmianie filtrów, zapytania wyszukiwania lub danych wejściowych.
     */
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            if (initialData) {
                let processedData = [...initialData];

                if (searchQuery) {
                    const lowerQuery = searchQuery.toLowerCase();
                    processedData = processedData.filter(item =>
                        item.book.title.toLowerCase().includes(lowerQuery) ||
                        item.user.surname.toLowerCase().includes(lowerQuery) ||
                        item.user.name.toLowerCase().includes(lowerQuery)
                    );
                }

                if (filters.status && filters.status.length > 0 && !filters.status.includes('any')) {
                    processedData = processedData.filter(item => {
                        if (filters.status.includes('active') && item.status === 'active') return true;
                        return (filters.status.includes('returned_pending') && item.status === 'returned_pending')
                    });
                }

                if (filters.po_terminie && filters.po_terminie.includes('any')) {
                    const now = new Date();
                    processedData = processedData.filter(item =>
                        item.status === 'active' && now > item.return_date
                    );
                }

                if (filters.sort && filters.sort.length > 0) {
                    const sortKey = filters.sort[0];
                    processedData.sort((a, b) => {
                        switch (sortKey) {
                            case 'fine_desc': return b.fineAmount - a.fineAmount;
                            case 'fine_asc': return a.fineAmount - b.fineAmount;
                            case 'date_desc': return b.borrow_date.getTime() - a.borrow_date.getTime();
                            case 'date_asc': return a.borrow_date.getTime() - b.borrow_date.getTime();
                            default: return 0;
                        }
                    });
                }

                setRents(processedData);
                setTotalPages(Math.ceil(processedData.length / ITEMS_PER_PAGE) || 1);
            } else {
                const rawData = await fetchRentLog(
                    searchQuery,
                    filters.sort,
                    filters
                );

                const processedData = processApiData(rawData);

                setRents(processedData);
                setTotalPages(Math.ceil(processedData.length / ITEMS_PER_PAGE) || 1);
            }

        } catch (error) {
            console.error("Błąd podczas pobierania danych:", error);
            setAlertConfig({
                isOpen: true,
                title: "Błąd serwera",
                message: "Nie udało się pobrać danych o wypożyczeniach. Sprawdź połączenie z internetem.",
                onAccept: () => setAlertConfig(prev => ({...prev, isOpen: false})),
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    }, [initialData, searchQuery, filters]);

    useEffect(() => {
        const loadData = async () => {
            await refreshData();
        };
        loadData();
    }, [refreshData]);


    const handleSearch = (data: SearchPanelReturn) => {
        setSearchQuery(data.search);
        setFilters(data.filter);
        setCurrentPage(1);
    };

    const handleFilterChange = (key: string) => (values: string[]) => {
        setActiveFilters(prev => ({ ...prev, [key]: values }));
        setFilters((prev: any) => ({ ...prev, [key]: values }));
    };

    /**
     * Resetuje wszystkie aktywne filtry, wyszukiwanie i wraca do pierwszej strony.
     */
    const handleResetFilters = () => {
        setActiveFilters({});
        setFilters({});
        setSearchQuery("");
        setCurrentPage(1);
    };


    /**
     * Inicjuje proces przedłużenia wypożyczenia.
     * Wyświetla alert z prośbą o potwierdzenie, a następnie wysyła żądanie do API.
     */
    const handleExtend = (rent: ExtendedRentInfo) => {
        setAlertConfig({
            isOpen: true,
            title: "Przedłużenie wypożyczenia",
            message: `Czy na pewno chcesz przedłużyć wypożyczenie książki "${rent.book.title}" dla użytkownika ${rent.user.name} ${rent.user.surname}?`,
            onAccept: async () => {
                try {
                    await extendRentRequest(rent.id);
                    await refreshData();
                } catch (error) {
                    console.error("Błąd przedłużania:", error);
                    setAlertConfig({
                        isOpen: true,
                        title: "Niepowodzenie",
                        message: "Wystąpił błąd podczas przedłużania wypożyczenia.",
                        onAccept: () => setAlertConfig(prev => ({...prev, isOpen: false})),
                        type: 'error'
                    });
                }
            },
            type: 'prolong'
        });
    };

    /**
     * Inicjuje proces zwrotu książki.
     * Wyświetla alert z informacją o naliczonej karze i prosi o potwierdzenie odbioru.
     */
    const handleReturn = (rent: ExtendedRentInfo) => {
        setAlertConfig({
            isOpen: true,
            title: "Potwierdzenie zwrotu",
            message: `Czy potwierdzasz odbiór książki "${rent.book.title}" od użytkownika ${rent.user.name} ${rent.user.surname}? \nKara do zapłaty: ${rent.fineAmount} zł`,
            onAccept: async () => {
                try {
                    await returnBookRequest(rent.id);
                    await refreshData();
                } catch (error) {
                    console.error("Błąd zwrotu:", error);
                    setAlertConfig({
                        isOpen: true,
                        title: "Niepowodzenie",
                        message: "Wystąpił błąd podczas zatwierdzania zwrotu.",
                        onAccept: () => setAlertConfig(prev => ({...prev, isOpen: false})),
                        type: 'error'
                    });
                }
            },
            type: 'return'
        });
    };

    const activeFilterCount = (Object.values(activeFilters) as string[][]).reduce((acc, curr) => acc + curr.length, 0);

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentRents = rents.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <>
            <NavSidebar />
            <div id="main-content">
                <h1><img src={borrowIcon} alt="" /> Wypożyczenia i zwroty</h1>

                <SearchPanel onSearch={handleSearch}>
                    <FilterResetButton
                        activeCount={activeFilterCount}
                        onReset={handleResetFilters}
                        label="Wyczyść filtry"
                    />
                    <CustomSelect label='Sortuj' filterKey='sort' initialValues={activeFilters['sort']} onChange={handleFilterChange('sort')}>
                        <CustomOption value="fine_asc">Kwota kary (rosnąco)</CustomOption>
                        <CustomOption value="fine_desc">Kwota kary (malejąco)</CustomOption>
                        <CustomOption value="date_asc">Data wypożyczenia (rosnąco)</CustomOption>
                        <CustomOption value="date_desc">Data wypożyczenia (malejąco)</CustomOption>
                    </CustomSelect>
                    <div className="separator"></div>
                    <CustomSelect label='Status' filterKey='status' initialValues={activeFilters['status']} onChange={handleFilterChange('status')}>
                        <CustomOption value="any">Dowolny</CustomOption>
                        <CustomOption value="active">Aktywny</CustomOption>
                        <CustomOption value="returned_pending">Oczekujący zwrot</CustomOption>
                    </CustomSelect>
                    <CustomSelect label='Po terminie' filterKey='po_terminie' menu_mode initialValues={activeFilters['po_terminie']} onChange={handleFilterChange('po_terminie')}>
                        <CustomOption value="any">Po terminie</CustomOption>
                    </CustomSelect>
                </SearchPanel>

                <div className="book-section">
                    {isLoading ? (
                        <div style={{textAlign: 'center', padding: '20px'}}>Ładowanie danych...</div>
                    ) : (
                        <div id="mixed-list" className="returns-list">
                            {currentRents.map((rent) => (
                                <RentedBookComponent
                                    key={rent.id}
                                    rent_info={rent}
                                    onUserClick={() => { setSelectedUser(rent.user); setIsUserPopupOpen(true); }}
                                    onBookClick={() => { setSelectedBook(rent.book); setIsBookPopupOpen(true); }}
                                    onExtend={() => handleExtend(rent)}
                                    onReturn={() => handleReturn(rent)}
                                />
                            ))}
                            {!isLoading && currentRents.length === 0 && <p style={{textAlign:'center', width:'100%'}}>Brak wyników</p>}
                        </div>
                    )}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            <Popup
                title="Szczegóły użytkownika"
                isOpen={isUserPopupOpen}
                setIsOpen={setIsUserPopupOpen}
                icon={userIcon}
            >
                {selectedUser && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'inherit' }}>
                        <tbody>
                        <tr>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Imię i nazwisko:</td>
                            <td style={{ padding: '4px 0', textAlign: 'right' }}>{selectedUser.name} {selectedUser.surname}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Email:</td>
                            <td style={{ padding: '4px 0', textAlign: 'right' }}>{selectedUser.email}</td>
                        </tr>
                        </tbody>
                    </table>
                )}
            </Popup>

            <Popup
                title="Szczegóły książki"
                isOpen={isBookPopupOpen}
                setIsOpen={setIsBookPopupOpen}
                icon={bookIcon}
            >
                {selectedBook && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'inherit' }}>
                        <tbody>
                        <tr>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Tytuł:</td>
                            <td style={{ padding: '4px 0', textAlign: 'right' }}>{selectedBook.title}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Autor:</td>
                            <td style={{ padding: '4px 0', textAlign: 'right' }}>{selectedBook.authors.join(", ")}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>Wydawnictwo:</td>
                            <td style={{ padding: '4px 0', textAlign: 'right' }}>{selectedBook.publisher} ({selectedBook.publish_year})</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '4px 0', fontWeight: 'bold' }}>ISBN:</td>
                            <td style={{ padding: '4px 0', textAlign: 'right' }}>{selectedBook.isbn_number}</td>
                        </tr>
                        </tbody>
                    </table>
                )}
            </Popup>

            <Alert
                isOpen={alertConfig.isOpen}
                setIsOpen={(val) => {
                    const newState = typeof val === 'function' ? val(alertConfig.isOpen) : val;
                    setAlertConfig({ ...alertConfig, isOpen: newState });
                }}
                title={alertConfig.title}
                message={alertConfig.message}
                onAccept={alertConfig.onAccept}
                icon={alertConfig.type === 'error' ? errorIcon : (alertConfig.type === 'return' ? checkIcon : refreshIcon)}
            />
        </>
    );
}

/**
 * Komponent, który prezentuje jeden wpis dotyczący wypożyczenia książki.
 * Na podstawie terminu zwrotu i obecnej daty komponent ustala status wypożyczenia.
 * @component
 */
class RentedBookComponent extends React.Component<{
    /** Obiekt zawierający pełne dane o wypożyczeniu, użytkowniku, książce i karach. */
    rent_info: ExtendedRentInfo,
    /** Funkcja wywoływana po kliknięciu, w nazwę użytkownika. */
    onUserClick: () => void,
    /** Funkcja wywoływana po kliknięciu, w tytuł książki. */
    onBookClick: () => void,
    /** Funkcja wywoływana w celu przedłużenia wypożyczenia. */
    onExtend: () => void,
    /** Funkcja wywoływana w celu zatwierdzenia zwrotu książki. */
    onReturn: () => void
}, any> {

    /**
     * Formatuje obiekt daty do czytelnego polskiego formatu (YYYY-MM-DD).
     */
    private formatDate(date: Date): string {
        return date.toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-');
    }

    /**
     * Oblicza bezwzględną różnicę w dniach pomiędzy dwiema datami.
     */
    private getDaysDiff(date1: Date, date2: Date): number {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Renderuje interfejs karty wypożyczenia.
     */
    render() {
        const { rent_info, onUserClick, onBookClick, onReturn } = this.props;

        const isReturnedPending = rent_info.status === 'returned_pending';
        const isAnyReturned = isReturnedPending;

        const isOverdue = !isReturnedPending && new Date() > rent_info.return_date;

        let daysDiff;
        if (isAnyReturned && rent_info.actualReturnDate) {
            daysDiff = this.getDaysDiff(rent_info.actualReturnDate, rent_info.return_date);
        } else {
            daysDiff = this.getDaysDiff(new Date(), rent_info.return_date);
        }

        const panelClass = isAnyReturned ? "panel type-return" : "panel type-active";
        const headerIcon = isAnyReturned ? returnsIcon : bookIcon;
        const headerText = isAnyReturned ? "Oczekujący zwrot" : "Aktywne wypożyczenie";

        const dateContainerStyle = isReturnedPending
            ? { backgroundColor: '#fee6f0' }
            : {};

        return (
            <div className={panelClass}>
                <h3 className="header">
                    <img src={headerIcon} alt="" /> {headerText}
                </h3>

                <CustomTooltip title="Naciśnij, aby zobaczyć szczegóły użytkownika">
                    <a onClick={onUserClick} style={{ textAlign: 'left', display: 'block', cursor: 'pointer' }}>
                        <strong>{rent_info.user.name} {rent_info.user.surname}</strong>
                        <span className="user-email">
                            <img src={userIcon} className="date-icon" alt="" />
                            <span>{rent_info.user.email}</span>
                        </span>
                    </a>
                </CustomTooltip>

                <CustomTooltip title="Naciśnij, aby zobaczyć szczegóły książki" >
                    <a onClick={onBookClick} style={{ textAlign: 'left', display: 'block', cursor: 'pointer' }}>
                        <strong>Tytuł: „{rent_info.book.title}”</strong>
                        <span className="user-email" style={{ display: 'block', marginTop: '0.25em' }}>
                            <img
                                src={bookIcon}
                                className="date-icon"
                                alt=""
                                style={{ filter: 'invert(40%) sepia(0%) saturate(0%) hue-rotate(200deg) brightness(80%) contrast(90%)' }}
                            />
                            <span>Autor: {rent_info.book.authors.join(", ")}</span>
                        </span>
                    </a>
                </CustomTooltip>

                <div className="details-grid">
                    <div className="date-container" style={dateContainerStyle}>
                        <span className="date-label">Data wypożyczenia</span>
                        <div className="date-value">
                            <img src={calendarIcon} className="date-icon" alt="" />
                            <span>{this.formatDate(rent_info.borrow_date)}</span>
                        </div>
                    </div>
                    <div className="date-container" style={dateContainerStyle}>
                        <span className="date-label">
                            {isAnyReturned ? "Data faktycznego zwrotu" : "Termin zwrotu"}
                        </span>
                        <div className="date-value">
                            <img src={calendarIcon} className="date-icon" alt="" />
                            <span>
                                {isAnyReturned && rent_info.actualReturnDate
                                    ? this.formatDate(rent_info.actualReturnDate)
                                    : this.formatDate(rent_info.return_date)
                                }
                            </span>
                        </div>
                    </div>
                </div>

                <div className="action-row">
                    <div className="status-fine-row">
                        {isAnyReturned ? (
                            rent_info.fineAmount > 0 ? (
                                <span className="status-badge status-overdue">
                                    <img src={errorIcon} className="status-icon" alt="" />
                                    Oddano {daysDiff} dni po terminie
                                </span>
                            ) : (
                                <span className="status-badge status-ontime">
                                    <img src={checkIcon} className="status-icon" alt="" />
                                    Oddano w terminie
                                </span>
                            )
                        ) : (
                            isOverdue ? (
                                <span className="status-badge status-overdue">
                                    <img src={errorIcon} className="status-icon" alt="" />
                                    Przeterminowane: {daysDiff} dni
                                </span>
                            ) : (
                                <span className="status-badge status-pending">
                                    <img src={scheduleIcon} className="status-icon" alt="" />
                                    Pozostało {daysDiff} dni
                                </span>
                            )
                        )}

                        <div className="fine-display">
                            <span className="fine-label">
                                {isAnyReturned ? "Naliczona kara" : (rent_info.fineAmount > 0 ? "Kara do zapłaty" : "Kara")}
                            </span>
                            <span className={rent_info.fineAmount > 0 ? "fine-red" : "fine-black"}>
                                {rent_info.fineAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {isAnyReturned ? (
                        <button style={{ width: '100%' }} onClick={onReturn}>
                            <img src={checkIcon} alt="" /> Potwierdź odbiór książki
                        </button>
                    ) : (
                        <div className="button-row">
                            <button onClick={() => this.extendRent()}>
                                <img src={refreshIcon} alt="" /> Przedłuż wypożyczenie
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /**
     * @event extendRent wywoływany przez kliknięcie guzika "Przedłóż wypożyczenie" wysyła prośbę o przedłużenie wypożyczenia na serwer z użyciem funkcji extendRentRequest
     * @private
     * */
    private extendRent(){
        this.props.onExtend();
    }
}