/**
 * Plik implementujący widok strony /rented-books dla administratora. Umożliwiająca zarządzanie i przeglądanie wypożyczeń, przy łądowaniu odczytuje dane z linku przesłane metodą "GET" i wczytuje z nich filtrowanie i sortowanie wyników
 * @author Karol Dziuba
 *
 *
 * */

import type { Book, User } from "../../public/server_types.ts";
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

const ITEMS_PER_PAGE = 3;

/**
 * Reprezentuje szczegółowe informacje dotyczące transakcji wypożyczenia książki.
 *
 * @interface ExtendedRentInfo
 * @property {number} id - Unikalny identyfikator rekordu wypożyczenia.
 * @property {User} user - Obiekt użytkownika, który wypożyczył książkę.
 * @property {Book} book - Obiekt książki będącej przedmiotem wypożyczenia.
 * @property {Date} borrow_date - Data i czas rozpoczęcia wypożyczenia.
 * @property {Date} return_date - Planowany termin zwrotu książki (data wymagalności).
 * @property {'active' | 'returned_pending'} status - Aktualny status wypożyczenia:
 * - `'active'`: Wypożyczenie aktywne, książka znajduje się u użytkownika.
 * - `'returned_pending'`: Książka została zwrócona przez użytkownika, oczekuje na zatwierdzenie.
 * @property {number} fineAmount - Kwota naliczonej kary (np. 0, jeśli brak opóźnień).
 * @property {string} fineCurrency - Kod waluty kary (np. "PLN").
 * @property {Date} [actualReturnDate] - Rzeczywista data zwrotu książki (opcjonalna, wypełniona przy zwrocie).
 */

export interface ExtendedRentInfo {
    id: number;
    user: User;
    book: Book;
    borrow_date: Date;
    return_date: Date;
    status: 'active' | 'returned_pending' | 'returned_finished' | 'overdue';
    fineAmount: number;
    fineCurrency: string;
    actualReturnDate?: Date;
}

/**
 * Właściwości (props) przekazywane do komponentu widoku listy wypożyczonych książek.
 *
 * @interface RentedBooksListViewProps
 * @property {ExtendedRentInfo[]} [initialData] - Opcjonalny zestaw danych początkowych dla widoku.
 * Przydatny przy testowaniu, renderowaniu po stronie serwera (SSR) lub w Storybooku.
 * Jeśli nie zostanie podany, komponent samodzielnie pobierze dane z serwera po zamontowaniu.
 */

interface RentedBooksListViewProps {
    initialData?: ExtendedRentInfo[];
}

/**
 * Komponent widoku /rented-books.
 * Zarządza wyświetlaniem, filtrowaniem i obsługą procesów wypożyczeń oraz zwrotów książek.
 *
 * @returns {React.JSX.Element} Główny widok listy wypożyczeń.
 *
 * @requires NavSidebar - Pasek nawigacji bocznej.
 * @requires SearchPanel - Komponent obsługujący pasek wyszukiwania i kontenery filtrów.
 * @requires CustomSelect - Komponent wyboru (dropdown) do filtrowania statusów i sortowania.
 * @requires FilterResetButton - Przycisk resetujący wszystkie aktywne filtry.
 * @requires Pagination - Komponent do nawigacji między stronami wyników.
 * @requires Popup - Modal wyświetlający szczegóły użytkownika lub książki.
 * @requires Alert - Okno dialogowe potwierdzające krytyczne akcje (zwrot/przedłużenie).
 */
export default function RentedBooksListView({ initialData }: RentedBooksListViewProps) {
    /** Lista aktualnie wyświetlanych wypożyczeń (po filtracji/paginacji). */
    const [rents, setRents] = useState<ExtendedRentInfo[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [searchQuery, setSearchQuery] = useState("");
    /** Przechowuje stan surowych filtrów przekazywanych do logiki biznesowej/API. */
    const [filters, setFilters] = useState<any>({});
    /** Przechowuje stan aktywnych filtrów dla komponentów UI (np. zaznaczone opcje w Select). */
    const [activeFilters, setActiveFilters] = useState<{ [key: string]: string[] }>({});

    const [isLoading, setIsLoading] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);
    const [isBookPopupOpen, setIsBookPopupOpen] = useState(false);

    /**
     * Konfiguracja globalnego alertu (modala potwierdzenia).
     * Służy do obsługi potwierdzeń dla akcji 'prolong' (przedłużenie) oraz 'return' (zwrot).
     */
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onAccept?: () => void;
        type?: 'prolong' | 'return';
    }>({ isOpen: false, title: "", message: "" });


    /**
     * Mapuje surowe dane z API na format `ExtendedRentInfo`.
     * Odpowiada za:
     * 1. Konwersję stringów dat na obiekty `Date`.
     * 2. Wyliczenie statusu (np. wykrycie opóźnienia 'overdue').
     * 3. Kalkulację kar finansowych dla opóźnionych zwrotów.
     *
     * @param {any} rawData - Surowe dane (tablica lub obiekt z kluczem `items`).
     * @returns {ExtendedRentInfo[]} Przetworzona lista wypożyczeń.
     */
    const processApiData = (rawData: any): ExtendedRentInfo[] => {
        const dataArray = Array.isArray(rawData) ? rawData : (rawData?.items || []);

        return dataArray.map((item: any) => {
            const returnDate = new Date(item.return_date);
            const borrowDate = new Date(item.borrow_date);
            const now = new Date();

            let status: ExtendedRentInfo['status'] = 'active';
            let calculatedFine = 0;

            if (item.is_returned || item.status === 'returned' || item.status === 'returned_pending') {
                status = 'returned_pending';
            } else if (now > returnDate) {
                // Jeśli po terminie, oznaczamy jako overdue i naliczamy karę
                status = 'overdue'; // UWAGA: Zgodnie z interfejsem status powinien być 'active' | 'returned_pending', ale logika kodu używa 'overdue' wewnętrznie.
                const daysOver = Math.ceil((now.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
                calculatedFine = daysOver * 10;
            }

            return {
                id: item.id || item.rent_id,
                user: item.user,
                book: item.book,
                borrow_date: borrowDate,
                return_date: returnDate,
                status: status, // Należy upewnić się, że 'overdue' jest obsługiwane przez interfejs ExtendedRentInfo, jeśli nie, należy to poprawić w typach.
                fineAmount: item.fineAmount || calculatedFine,
                fineCurrency: 'PLN',
                actualReturnDate: item.actual_return_date ? new Date(item.actual_return_date) : undefined
            };
        });
    };


    /**
     * Odświeża dane w widoku.
     * Działa w dwóch trybach:
     * 1. **Tryb lokalny (Initial Data):** Filtruje i sortuje dostarczoną tablicę (np. dla testów).
     * 2. **Tryb API:** Wysyła zapytanie do serwera z parametrami paginacji, sortowania i filtrów.
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
                        if (filters.status.includes('returned_pending') && item.status === 'returned_pending') return true;
                        return false;
                    });
                }

                if (filters.po_terminie && filters.po_terminie.includes('any')) {
                    const now = new Date();
                    processedData = processedData.filter(item =>
                        item.status === 'overdue' || (item.status === 'active' && now > item.return_date)
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
        } finally {
            setIsLoading(false);
        }
    }, [initialData, searchQuery, filters]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    /**
     * Obsługuje zdarzenie wyszukiwania z komponentu SearchPanel.
     * Resetuje widok do pierwszej strony.
     */
    const handleSearch = (data: SearchPanelReturn) => {
        setSearchQuery(data.search);
        setFilters(data.filter);
        setCurrentPage(1);
    };

    /**
     * Obsługuje zmianę wartości w filtrach typu Select.
     * Aktualizuje zarówno stan widoku (activeFilters) jak i stan logiczny (filters).
     */
    const handleFilterChange = (key: string) => (values: string[]) => {
        setActiveFilters(prev => ({ ...prev, [key]: values }));
        setFilters((prev: any) => ({ ...prev, [key]: values }));
    };

    /**
     * Czyści wszystkie filtry i wyszukiwanie, przywracając widok do stanu początkowego.
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
                    alert("Wystąpił błąd podczas komunikacji z serwerem.");
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
            message: `Czy potwierdzasz odbiór książki "${rent.book.title}" od użytkownika ${rent.user.name} ${rent.user.surname}? \nKara do zapłaty: ${rent.fineAmount} ${rent.fineCurrency}`,
            onAccept: async () => {
                try {
                    await returnBookRequest(rent.id);
                    await refreshData();
                } catch (error) {
                    console.error("Błąd zwrotu:", error);
                    alert("Wystąpił błąd podczas komunikacji z serwerem.");
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
                    <div className="flex-column" style={{gap: '10px'}}>
                        <div><strong>Imię i nazwisko:</strong> {selectedUser.name} {selectedUser.surname}</div>
                        <div><strong>Email:</strong> {selectedUser.email}</div>
                    </div>
                )}
            </Popup>

            <Popup
                title="Szczegóły książki"
                isOpen={isBookPopupOpen}
                setIsOpen={setIsBookPopupOpen}
                icon={bookIcon}
            >
                {selectedBook && (
                    <div className="flex-column" style={{gap: '8px'}}>
                        <div><strong>Tytuł:</strong> {selectedBook.title}</div>
                        <div><strong>Autor:</strong> {selectedBook.authors.join(", ")}</div>
                        <div><strong>Wydawnictwo:</strong> {selectedBook.publisher} ({selectedBook.publish_year})</div>
                        <div><strong>ISBN:</strong> {selectedBook.isbn_number}</div>
                    </div>
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
                icon={alertConfig.type === 'return' ? checkIcon : refreshIcon}
            />
        </>
    );
}

/**
 * Komponent, który prezentuje jeden wpis dotyczący wypożyczenia książki.
 * Na podstawie terminu zwrotu i obecnej daty komponent ustala status wypożyczenia: Aktywne (przed terminem zwrotu), Przeterminowane (po terminie, dla którego naliczona jest opłata) i Archiwalne (książka zostałą zwrócona).
 * Dla Aktywnych wypożyczeń komponent umozliwia przedłużenie wypożyczenia (przez guzik "Przedłóż Wypożyczenie")
 * Dla Przeterminowanych informuje o naliczonej opłacie.
 * @prop props
 * @prop {RentFullInfo} props.rent_info - dane książki
 *
 * @requires extendRentRequest przedłuża czas wypożyczenia książki
 * @requires fetchRentLog pobiera informacje o wypożyczeniach do wyświetlenia
 * */

class RentedBookComponent extends React.Component<{
    /** Obiekt zawierający pełne dane o wypożyczeniu, użytkowniku, książce i karach. */
    rent_info: ExtendedRentInfo,
    /** Funkcja wywoływana po kliknięciu w nazwę użytkownika. */
    onUserClick: () => void,
    /** Funkcja wywoływana po kliknięciu w tytuł książki. */
    onBookClick: () => void,
    /** Funkcja wywoływana w celu przedłużenia wypożyczenia. */
    onExtend: () => void,
    /** Funkcja wywoływana w celu zatwierdzenia zwrotu książki. */
    onReturn: () => void
}, any> {

    /**
     * Formatuje obiekt daty do czytelnego polskiego formatu (RRRR-MM-DD).
     *
     * @private
     * @param {Date} date - Obiekt daty do sformatowania.
     * @returns {string} Sformatowana data jako ciąg znaków.
     */
    private formatDate(date: Date): string {
        return date.toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-');
    }

    /**
     * Oblicza bezwzględną różnicę w dniach pomiędzy dwiema datami.
     * Używana do wyświetlania liczby dni pozostałych do zwrotu lub dni opóźnienia.
     *
     * @private
     * @param {Date} date1 - Pierwsza data.
     * @param {Date} date2 - Druga data.
     * @returns {number} Liczba dni (zaokrąglona w górę).
     */
    private getDaysDiff(date1: Date, date2: Date): number {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Renderuje interfejs karty wypożyczenia.
     * Wewnątrz metody obliczane są flagi logiczne (np. `isOverdue`, `isReturnedPending`)
     * decydujące o stylu panelu (kolorach) i wyświetlanych ikonach.
     *
     * @returns {React.JSX.Element} Wyrenderowany element panelu.
     */
    render() {
        const { rent_info, onUserClick, onBookClick, onReturn } = this.props;

        const isReturnedPending = rent_info.status === 'returned_pending';
        const isReturnedFinished = rent_info.status === 'returned_finished'; // Uwaga: status ten nie występuje w interfejsie ExtendedRentInfo, ale jest w logice
        const isAnyReturned = isReturnedPending || isReturnedFinished;
        const isOverdue = rent_info.status === 'overdue' || (!isAnyReturned && new Date() > rent_info.return_date);

        let daysDiff = 0;
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
                                {rent_info.fineAmount.toFixed(2)} {rent_info.fineCurrency}
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
     * Obsługuje logikę przedłużania wypożyczenia.
     * Wywoływana przez kliknięcie przycisku "Przedłuż wypożyczenie".
     * Przekazuje intencję do komponentu nadrzędnego poprzez props `onExtend`.
     *
     * @private
     */
    private extendRent(){
        this.props.onExtend();
    }
}