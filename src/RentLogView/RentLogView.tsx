/**
 * Plik implementujący widok strony /rented-books dla administratora. Umożliwiająca zarządzanie i przeglądanie wypożyczeń, przy łądowaniu odczytuje dane z linku przesłane metodą "GET" i wczytuje z nich filtrowanie i sortowanie wyników
 * @author Karol Dziuba
 * */
import type {RentFullInfo, RentLogSearchFilter, SearchSort} from "../server/server_types.ts";
import {extendRentRequest, fetchRentLog, returnBookRequest} from "../server/server_requests.ts";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {useSearchParams} from "react-router-dom";
import NavSidebar from "../general_elements/NavSidebar.tsx";
import SearchPanel, {type SearchPanelReturn} from "../general_elements/SearchPanel.tsx";
import {Pagination} from "../general_elements/Pagination.tsx";
import {CustomOption, CustomSelect, FilterResetButton} from "../custom_components/CustomSelect.tsx";
import ToggleButton from "../custom_components/ToggleButton.tsx";
import {Alert} from "../custom_components/Popup.tsx";
import './RentLogView.css';

import bookIcon from '/assets/book.svg';
import userIcon from '/assets/mail.svg';
import calendarIcon from '/assets/calendar.svg';
import errorIcon from '/assets/error.svg';
import checkIcon from '/assets/check.svg';
import scheduleIcon from '/assets/schedule.svg';
import refreshIcon from '/assets/refresh.svg';
import returnsIcon from '/assets/returns.svg';
import borrowIcon from '/assets/borrow.svg';

/**
 * Określa maksymalną liczbę wpisów wypożyczonych książek wyświetlanych na jednej stronie
 * w widoku stronicowania.
 *
 * @constant
 * @type {number}
 */
const ITEMS_PER_PAGE: number = 3;

/**
 * @interface ExtendedRentInfo Reprezentuje szczegółowe informacje dotyczące transakcji wypożyczenia książki.
 * Rozszerza standardowy model danych o pola obliczane po stronie klienta (status, kara).
 *
 * @extends {Omit<RentFullInfo, 'borrow_date' | 'return_date' | 'return_to_date'>}
 *
 * @prop {number} id - Unikalne ID wypożyczenia
 * @prop {Date} borrow_date - Data wypożyczenia
 * @prop {Date} return_date - Termin zwrotu (deadline)
 * @prop {'active' | 'returned_pending'} status - Status logiczny: 'active' (wypożyczona) lub 'returned_pending' (oddana, czeka na akceptację/archiwum)
 * @prop {number} fineAmount - Obliczona kwota kary finansowej
 * @prop {Date} [actualReturnDate] - Data faktycznego zwrotu (jeśli nastąpił)
 */
export interface ExtendedRentInfo extends Omit<RentFullInfo, 'borrow_date' | 'return_date' | 'return_to_date'> {
    id: number;
    borrow_date: Date;
    return_date: Date;
    status: 'active' | 'returned_pending';
    fineAmount: number;
    actualReturnDate?: Date;
}


/**
 * Komponent widoku /rented-books.
 * Służy do zarządzania procesem wypożyczeń, oferując wgląd w listę, filtrowanie, sortowanie oraz akcje (przedłużenie, zwrot).
 *
 * @returns {React.JSX.Element} Pełny widok strony zarządzania wypożyczeniami.
 */
export default function RentLogView(): React.JSX.Element {
    const [searchParams, setSearchParams] = useSearchParams();

    const [rents, setRents] = useState<ExtendedRentInfo[]>([]);
    const isUpdatingUrlRef = useRef(false);

    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || "");
    const [filters, setFilters] = useState<RentLogSearchFilter | undefined>( {});
    const DEFAULT_SORTING: SearchSort = {key: 'rent-date', direction: "ASC"}
    const [sort, setSort] = useState<SearchSort>(DEFAULT_SORTING)

    const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
    const [totalPages, setTotalPages] = useState(1);

    const [isLoading, setIsLoading] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onAccept?: () => void;
        type?: 'prolong' | 'return' | 'error';
    }>({ isOpen: false, title: "", message: "" });

    /**
     * Asynchroniczna funkcja odświeżająca dane w widoku.
     * Wysyła zapytanie do serwera (`fetchRentLog`) z parametrami paginacji, sortowania i filtrów.
     *
     * Funkcja jest memoizowana (useCallback) w zależności od filtrów, strony i danych wejściowych.
     */
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const rawData = await fetchRentLog(
                searchQuery,
                sort,
                filters,
                currentPage);
            
            let finalData = rawData.result.map((item: RentFullInfo): ExtendedRentInfo => {
                return {
                    ...item,
                    id: item.instance_id,
                    user: item.user,
                    book: item.book,
                    borrow_date: item.borrow_date,
                    return_date: item.return_to_date,
                    status: item.return_to_date ? 'active' : 'returned_pending',
                    fineAmount: item.fine,
                    actualReturnDate: item.return_date ?? undefined
                }});
            if (filters && filters.isOverdue) {
                const now = new Date();
                finalData = finalData.filter(item => {
                    if (item.status === 'active') return now > item.return_date;
                    if (item.status === 'returned_pending' && item.actualReturnDate) {
                        return item.actualReturnDate > item.return_date;
                    }
                    return false;
                });
            }

            setRents(finalData);
            setTotalPages(rawData.totalPages || 1);
        } catch (error: any) {
            console.error("Błąd podczas pobierania danych:", error);
            if(error.cause === 'Odmowa dostępu'){
                window.location.href = "/access-denied";
                return
            }
            setAlertConfig({
                isOpen: true,
                title: "Błąd serwera",
                message: error.message ?? "Nieoczekiwany błąd",
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    }, [filters, searchQuery, sort, currentPage]);

    /**
     * Wczytuje dane z URL przy łądowaniu strony
     * */
    useEffect(() => {
        if (isUpdatingUrlRef.current) {
            isUpdatingUrlRef.current = false;
            return;
        }

        const query = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const sort = searchParams.get('sort');
        const states = searchParams.get('states');
        const overdue = searchParams.get('overdue');

        const initialFilters: RentLogSearchFilter = {};

        if (sort) {
            const spl_key = sort.split('_')
            setSort({
                key: spl_key[0],
                direction: spl_key[1] as SearchSort['direction'],
            })
        }
        if (states && states as RentLogSearchFilter['states']) {
            initialFilters.states = states as RentLogSearchFilter['states'];
        }
        if (overdue) {
            initialFilters.isOverdue = overdue === 'true';
        }

        setSearchQuery(query);
        setFilters(initialFilters);
        setCurrentPage(page);
    }, [searchParams]);

    const [lastRefreshParams, setLastRefreshParams] = useState<string>("");

    useEffect(() => {
        const currentParams = JSON.stringify({ searchQuery, filters, currentPage });
        if (currentParams !== lastRefreshParams) {
            setLastRefreshParams(currentParams);
            void refreshData();
        }
    }, [refreshData, searchQuery, filters, currentPage, lastRefreshParams]);


    /**
     * Obsługuje zdarzenie wyszukiwania z komponentu SearchPanel.
     * Resetuje paginację do pierwszej strony.
     */
    const handleSearch = (data: SearchPanelReturn) => {
        setSearchQuery(data.search);
        if(data.filter)
            setFilters(data.filter as RentLogSearchFilter);
        if(data.sorting)
            setSort(data.sorting);
        setCurrentPage(1);
        updateUrlParams(data.search, data.filter as RentLogSearchFilter, data.sorting, 1);
    };

    /**
     * Obsługuje zmianę sortowania wyników.
     * Parsuje wartość sortowania z formatu "klucz_kierunek" i aktualizuje stan sortowania.
     * Resetuje paginację do pierwszej strony i aktualizuje parametry URL.
     *
     * @param {string[]} sorting - Tablica zawierająca wybrane wartości sortowania w formacie "klucz_kierunek" (np. ["rent-date_asc"]).
     */
    const handleSortChange = (sorting: string[]) => {
        const spl_key = sorting[0].split('_')
        const new_sort = {
            key: spl_key[0],
            direction: spl_key[1] as SearchSort['direction'],
        }
        setSort(new_sort);
        setCurrentPage(1);
        updateUrlParams(searchQuery, filters, new_sort);
    }
    /**
     * Obsługuje zmianę pojedynczego filtra status.
     * @param value
     */
    const handleFilterChange = (value: string[]): void => {
        const new_filters = {...filters, 'states': value[0] as RentLogSearchFilter['states']};
        setFilters(new_filters);
        setCurrentPage(1);
        updateUrlParams(searchQuery, new_filters, sort);
    };

    const handleOverdueChange = (values: boolean) => {
        const new_filters = {...filters, 'isOverdue': values};
        setFilters(new_filters);
        setCurrentPage(1);
        updateUrlParams(searchQuery, new_filters, sort);
    }
    /**
     * Resetuje wszystkie aktywne filtry i wyszukiwanie.
     */
    const handleResetFilters = () => {
        setSort(DEFAULT_SORTING);
        setFilters({});
        setSearchQuery("");
        setCurrentPage(1);
        updateUrlParams();
    };

    /**
     * Aktualizuje parametry URL na podstawie aktualnego stanu wyszukiwania, filtrów i strony.
     */
    const updateUrlParams = (search: string = '', currentFilters?: RentLogSearchFilter, sort?: SearchSort, page: number = 1) => {
        const params = new URLSearchParams();

        if (search) {
            params.set('search', search);
        }
        if (page > 1) {
            params.set('page', page.toString());
        }
        if (sort) {
            params.set('sort', sort.key + '_'+ sort.direction);
        }
        if(currentFilters){
            if (currentFilters.states) {
                params.set('states', currentFilters.states);
            }
            if (currentFilters.isOverdue) {
                params.set('overdue', currentFilters.isOverdue ? 'true' : 'false');
            }
        }

        const paramsString = params.toString();
        if (paramsString !== searchParams.toString()) {
            isUpdatingUrlRef.current = true;
            setSearchParams(params, { replace: true });
        }
    };


    /**
     * Inicjuje procedurę przedłużenia wypożyczenia.
     * Wyświetla okno dialogowe z prośbą o potwierdzenie.
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
                    setAlertConfig({
                        isOpen: true, title: "Niepowodzenie", message: "Wystąpił błąd.", type: 'error',
                        onAccept: () => setAlertConfig(prev => ({...prev, isOpen: false}))
                    });
                }
            },
            type: 'prolong'
        });
    };

    /**
     * Inicjuje procedurę zatwierdzenia zwrotu książki.
     * Wyświetla okno dialogowe z informacją o ewentualnej karze.
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
                    setAlertConfig({
                        isOpen: true, title: "Niepowodzenie", message: "Wystąpił błąd.", type: 'error',
                        onAccept: () => setAlertConfig(prev => ({...prev, isOpen: false}))
                    });
                }
            },
            type: 'return'
        });
    };

    const activeFilterCount = (filters?.isOverdue ? 1 : 0) + (filters?.states ? 1 : 0) + (searchQuery ? 1 : 0);

    return (
        <>
            <NavSidebar />
            <main id="main-content">
                <h1><img src={borrowIcon} alt="" /> Wypożyczenia i zwroty</h1>

                <SearchPanel onSearch={handleSearch}>
                    <FilterResetButton
                        activeCount={activeFilterCount}
                        onReset={handleResetFilters}
                        label="Wyczyść filtry"
                    />
                    <CustomSelect label='Sortuj' filterKey='sort'
                                  initialValues={sort ? [sort.key + '_' + sort.direction] : undefined}
                                  onChange={handleSortChange}>
                        <CustomOption value="rent-date_ASC">Data wypożyczenia (rosnąco)</CustomOption>
                        <CustomOption value="rent-date_DESC">Data wypożyczenia (malejąco)</CustomOption>
                        <CustomOption value="return-date_ASC">Data zwrotu (rosnąco)</CustomOption>
                        <CustomOption value="return-date_DESC">Data zwrotu (malejąco)</CustomOption>
                    </CustomSelect>
                    <div className="separator"></div>
                    <CustomSelect label='Status'
                                  filterKey='states'
                                  initialValues={filters && filters['states'] ? [filters['states']] : []}
                                  onChange={handleFilterChange}>
                        <CustomOption value="active">Aktywny</CustomOption>
                        <CustomOption value="achive">Archiwalne</CustomOption>
                    </CustomSelect>
                    <ToggleButton
                        label="Po terminie"
                        initialValue={filters?.isOverdue ?? false}
                        onChange={handleOverdueChange}
                    />
                </SearchPanel>

                <div className="book-section">
                    {isLoading ? (
                        <div style={{textAlign: 'center', padding: '20px'}}>Ładowanie danych...</div>
                    ) : (
                        <div id="mixed-list" className="returns-list">
                            {rents.map((rent) => (
                                <RentedBookComponent
                                    key={rent.id}
                                    rent_info={rent}
                                    onExtend={() => handleExtend(rent)}
                                    onReturn={() => handleReturn(rent)}
                                />
                            ))}
                            {rents.length === 0 && <p style={{textAlign:'center', width:'100%'}}>Brak wyników</p>}
                        </div>
                    )}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        updateUrlParams(searchQuery, filters, sort, page);
                    }}
                />
            </main>

            <Alert
                isOpen={alertConfig.isOpen}
                setIsOpen={(val: boolean) => {
                    setAlertConfig({ ...alertConfig, isOpen: val });
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
 * Komponent klasowy prezentujący pojedynczą kartę wypożyczenia.
 * Odpowiada za wyświetlenie danych, statusu, dat oraz przycisków akcji.
 */
class RentedBookComponent extends React.Component<{
    rent_info: ExtendedRentInfo,
    onExtend: () => void,
    onReturn: () => void
}, any> {

    /**
     * Formatuje datę do polskiego formatu (DD-MM-YYYY).
     */
    private formatDate(date: Date): string {
        return date.toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-');
    }

    /**
     * Oblicza różnicę dni między dwiema datami.
     */
    private getDaysDiff(date1: Date, date2: Date): number {
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    render() {
        const { rent_info, onReturn } = this.props;

        const isNotReturned = rent_info.return_date === null;

        const isOverdue = !isNotReturned && new Date() > rent_info.return_date;

        let daysDiff;
        if (isNotReturned && rent_info.return_date) {
            daysDiff = this.getDaysDiff(rent_info.return_date, rent_info.return_date);
        } else {
            daysDiff = this.getDaysDiff(new Date(), rent_info.return_date);
        }

        const panelClass = isNotReturned ? "panel type-return" : "panel type-active";
        const headerIcon = isNotReturned ? returnsIcon : bookIcon;
        const headerText = isNotReturned ? "Zwrócono" : "Aktywne wypożyczenie";

        const gridColumns = isNotReturned ? 'repeat(3, minmax(0, 1fr))' : 'repeat(2, minmax(0, 1fr))';
        const showFine = isNotReturned && rent_info.fine > 0;

        return (
            <div className={panelClass}>
                <h3 className="header">
                    <img src={headerIcon} alt="" /> {headerText}
                </h3>

                <div>
                    <strong>{rent_info.user.name} {rent_info.user.surname}</strong>
                    <span className="user-email">
                        <img src={userIcon} className="date-icon" alt="" />
                        <span>{rent_info.user.email}</span>
                    </span>
                </div>
                <div>
                    <strong>Tytuł: „{rent_info.book.title}” - {rent_info.book.authors.join(', ')}</strong>
                    <span className="user-email" style={{ display: 'block', marginTop: '0.25em' }}>
                        <img
                            src={bookIcon}
                            className="date-icon"
                            alt=""
                            style={{ filter: 'invert(40%) sepia(0%) saturate(0%) hue-rotate(200deg) brightness(80%) contrast(90%)' }}
                        />
                        <span>Autor: {rent_info.book.authors.join(", ")}</span>
                    </span>
                </div>
                <div className="details-grid" style={{ gridTemplateColumns: gridColumns }}>
                    <div className="date-container">
                        <span className="date-label">Data wypożyczenia</span>
                        <div className="date-value">
                            <img src={calendarIcon} className="date-icon" alt="" />
                            <span>{this.formatDate(rent_info.borrow_date)}</span>
                        </div>
                    </div>

                    <div className="date-container">
                        <span className="date-label">Termin zwrotu</span>
                        <div className="date-value">
                            <img src={calendarIcon} className="date-icon" alt="" />
                            <span>{this.formatDate(rent_info.return_date)}</span>
                        </div>
                    </div>

                    {isNotReturned && (
                        <div className="date-container">
                            <span className="date-label">Data faktycznego zwrotu</span>
                            <div className="date-value">
                                <img src={calendarIcon} className="date-icon" alt="" />
                                <span>
                                    {rent_info.actualReturnDate
                                        ? this.formatDate(rent_info.actualReturnDate)
                                        : "---"
                                    }
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="action-row">
                    <div className="status-fine-row">
                        {isNotReturned ? (
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

                        {showFine && (
                            <div className="fine-display">
                                <span className="fine-label">
                                    Naliczona kara
                                </span>
                                <span className="fine-red">
                                    {rent_info.fineAmount.toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="button-row">
                        {isNotReturned ? (
                            <button onClick={onReturn}>
                                <img src={checkIcon} alt="" /> Potwierdź odbiór książki
                            </button>
                        ) : (
                            <button onClick={() => this.extendRent()}>
                                <img src={refreshIcon} alt="" /> Przedłuż wypożyczenie
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }
    private extendRent(){
        this.props.onExtend();
    }
}