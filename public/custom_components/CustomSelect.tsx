/**
 * @file CustomSelect.tsx
 * @description Implementacja niestandardowego komponentu wyboru (Select)
 * @author Karol Dziuba
 */

import React, { Component, createRef } from 'react';
import { createPortal } from 'react-dom';
import type IFormComponent from "./IFormComponent.tsx";
import './CustomSelect.css';
import '../../src/input.css';
import '../../src/style.css';

/**
 * Komponent prezentacyjny wyświetlający ikonę wyszukiwania (lupę).
 *
 * Szczegóły implementacyjne:
 * - **Kolorowanie**: Używa zaawansowanego filtra CSS (`filter`), aby narzucić konkretny kolor
 * na plik SVG bez konieczności jego fizycznej edycji.
 * - **Dostępność**: Pusty atrybut `alt=""` oznacza, że ikona jest traktowana jako element dekoracyjny
 * i zostanie pominięta przez czytniki ekranowe (screen readers).
 *
 * @param {object} props - Właściwości komponentu.
 * @param {string} [props.className=""] - Opcjonalna klasa CSS, zazwyczaj używana do ustalenia
 * wymiarów lub marginesów ikony.
 */

const SearchIcon = ({ className = "" }: { className?: string }) => (
    <img
        src="src/assets/search.svg"
        alt=""
        className={className}
        style={{ filter: 'invert(19%) sepia(43%) saturate(3686%) hue-rotate(314deg) brightness(91%) contrast(98%)' }}
    />
);

/**
 * Przycisk służący do resetowania wszystkich wybranych filtrów.
 * Wyświetla etykietę oraz liczbę aktywnych filtrów.
 * @param activeCount - liczba aktywnych filtrów
 * @param onReset - funkcja wywołania po kliknięciu
 * @param label - Tekst wyświetlany na przycisku
 */
export const FilterResetButton = ({ activeCount = 0, onReset, label = "Wyczyść filtry" }: { activeCount?: number; onReset: () => void; label?: string; }) => (
    <button
        type="button"
        className="filtered filter-reset-btn"
        onClick={onReset}
    >
        {label} ({activeCount})
    </button>
);

/**
 * Kontekst zapewniający komunikację i współdzielenie stanu między głównym komponentem CustomSelect a jego opcjami.
 *
 * @property {Set<string>} selectedValues - Zbiór unikalnych identyfikatorów aktualnie wybranych opcji.
 * @property {(value: string, label: string) => void} onSelect - Funkcja zwrotna wywoływana w momencie kliknięcia lub zatwierdzenia opcji.
 * @property {string} searchQuery - Aktualna fraza wpisana przez użytkownika w pole wyszukiwania.
 * @property {number} focusedIndex - Indeks numeryczny elementu, który jest aktualnie podświetlony (nawigacja klawiaturą/myszą).
 * @property {(index: number) => void} setFocusedIndex - Funkcja służąca do ręcznego ustawienia indeksu podświetlonego elementu.
 * @property {(value: string, label: string) => void} registerOption - Metoda pozwalająca opcjom potomnym (CustomOption) zarejestrować swoją etykietę w mapie rodzica.
 */

interface SelectContextType {
    selectedValues: Set<string>;
    onSelect: (value: string, label: string) => void;
    searchQuery: string;
    focusedIndex: number;
    setFocusedIndex: (index: number) => void;
    registerOption: (value: string, label: string) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);


/**
 * Typ właściwości dla pojedynczej opcji wyboru
 * @property value - Unikalna wartość opcji
 * @property children - Wyświetlana etykieta lub element
 * @property className - Dodatkowa klasa CSS
 * @property index - Indeks elementu
 * @property onClick - opcjonalna funkcja wywołania po kliknięciu w opcje.
 */

export interface CustomOptionProps {
    value: string;
    children: string | React.ReactNode;
    className?: string;
    index?: number;
    onClick?:(e: React.MouseEvent) => void;
    /** Czy opcja jest aktualnie wybrana? (dla styli CSS) */
    isSelected?: boolean;

    /** Czy opcja jest podświetlona strzałkami klawiatury? (dla styli CSS) */
    isFocused?: boolean;

    /**
     * Funkcja zwrotna do rodzica (CustomSelect).
     * Wywoływana, gdy opcja zostanie kliknięta, aby poinformować rodzica o zmianie.
     */
    onSelect?: (value: string, label: string) => void;
}

/**
 * Typ właściwości dla głównego komponentu Select
 * @property label - Etykieta przycisku otwierającego listę
 * @property allow_multiple - Czy pozwala na wybór wielu opcji (domyślnie false)
 * @property searchable - Czy lista ma pole wyszukiwania
 * @property onChange - Callback wywoływany przy zmianie wyboru
 * @property initialValues - Wartości początkowe
 * @property className - Dodatkowa klasa CSS
 * @property allowCustomRange - Czy wyświetlić panel zakresu dat zamiast listy opcji
 * @property menu_mode - Tryb, w którym nie pokazuje się wybrana opcja na dole przycisku.
 * @property filterKey - Jak nazwać filtr w zapytaniu do serwera.
 */

export interface CustomSelectProps {
    children?: React.ReactNode;
    label: string;
    allow_multiple?: boolean; // Default false
    searchable?: boolean;
    onChange?: (values: string[]) => void;
    initialValues?: string[];
    className?: string;
    allowCustomRange?: boolean;
    menu_mode? :boolean;
    filterKey: string;
}

/**
 * Stan wewnętrzny komponentu CustomSelect
 * @property isOpen - Czy lista rozwijana jest widoczna
 * @property selectedValues - Zbiór wybranych wartości
 * @property labelMap - Mapa mapująca wartości na etykiety
 * @property searchQuery - Aktualna fraza wyszukiwania
 * @property focusedIndex - Indeks aktualnie podświetlonego elementu (nawigacja klawiaturą)
 * @property position - Obliczona pozycja dropdowna względem przycisku aktywacji
 */

interface CustomSelectState {
    isOpen: boolean;
    selectedValues: Set<string>;
    labelMap: Map<string, string>;
    searchQuery: string;
    focusedIndex: number;
    position: { top: number; left: number; arrowLeft: number } | null;
}

/**
 * Komponent reprezentujący pojedynczą opcję na liście rozwijanej.
 *
 * Odpowiada za wyświetlanie elementu, obsługę zdarzeń myszy (kliknięcie, najechanie)
 * oraz rejestrację swojej wartości i etykiety w kontekście rodzica (CustomSelect).
 */
export class CustomOption extends Component<CustomOptionProps> {
    private elementRef = createRef<HTMLButtonElement>();

    /**
     * Przypisanie kontekstu React do komponentu klasowego.
     */
    static contextType = SelectContext;

    /**
     * Deklaracja typu dla właściwości.
     */
    declare context: React.ContextType<typeof SelectContext>;

    /**
     * Metoda wywoływana natychmiast po zamontowaniu komponentu w drzewie DOM.
     * Służy do rejestracji opcji u rodzica.
     */
    componentDidMount() {
        const textContent = typeof this.props.children === 'string'
            ? this.props.children
            : String(this.props.value);

        this.context?.registerOption(this.props.value, textContent);
    }

    /**
     * Obsługuje zdarzenie najechania kursorem myszy na element opcji.
     * Aktualizuje 'focusedIndex' w stanie komponentu nadrzędnego
     */
    handleMouseEnter = () => {
        if (typeof this.props.index === 'number') {
            this.context?.setFocusedIndex(this.props.index);
        }
    };

    /**
     * Obsługuje zdarzenie kliknięcia myszą na element opcji.
     *
     * Logika działania:
     * 1. Jeśli przekazano prop `onClick`, jest on wywoływany w pierwszej kolejności.
     * 2. Sprawdza `e.defaultPrevented` - jeśli customowy handler zablokował zdarzenie,
     * standardowy wybór (onSelect) jest pomijany.
     * 3. W przeciwnym razie wykonuje standardową logikę wyboru i zatrzymuje propagację.
     *
     * @param e - Obiekt zdarzenia myszy.
     */
    handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {

        if (this.props.onClick) {
            this.props.onClick(e);
        }

        if (e.defaultPrevented) {
            return;
        }

        e.stopPropagation();

        const textContent = typeof this.props.children === 'string'
            ? this.props.children
            : String(this.props.value);

        this.context?.onSelect(this.props.value, textContent);
    };


    render() {
        if (!this.context) return null;

        const { selectedValues, searchQuery, focusedIndex } = this.context;
        const { value, children, className, index } = this.props;

        const isSelected = selectedValues.has(value);
        const isFocused = focusedIndex === index;


        return (
                <button
                    ref={this.elementRef}
                    type="button"
                    tabIndex={-1}
                    role="option"
                    aria-selected={isSelected}
                    onClick={this.handleClick}
                    onMouseEnter={this.handleMouseEnter}
                    className={`option-item ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''} ${className || ''}`}
                >
                    <span className="truncate">{children}</span>
                </button>
        );
    }
}

/**
 * Komponent główny listy rozwijanej.
 * Obsługuje logikę otwierania/zamykania, pozycjonowania, filtrowania opcji i zarządzania stanem wyboru.
 */
export class CustomSelect extends Component<CustomSelectProps, CustomSelectState> implements IFormComponent<any> {
    private triggerRef = createRef<HTMLDivElement>();
    private dropdownRef = createRef<HTMLDivElement>();
    private searchInputRef = createRef<HTMLInputElement>();

    constructor(props: CustomSelectProps) {
        super(props);
        this.state = {
            isOpen: false,
            selectedValues: new Set(props.initialValues || []),
            labelMap: new Map(),
            searchQuery: '',
            focusedIndex: -1,
            position: null
        };
    }

    /**
     * Metoda cyklu życia wywoływana bezpośrednio po aktualizacji komponentu.
     * W tym komponencie odpowiada za logikę efektów ubocznych:
     *
     * 1. **Synchronizacja danych:** Aktualizuje stan `selectedValues`, jeśli rodzic przekaże nowe `initialValues`.
     * 2. **Zarządzanie zdarzeniami:** Dodaje globalne event listenery w momencie otwarcia listy i usuwa je po jej zamknięciu.
     * 3. **Pozycjonowanie i Focus:** Przelicza pozycję dropdownu oraz ustawia focus na polu wyszukiwania po otwarciu.
     * 4. **Czyszczenie:** Resetuje frazę wyszukiwania po zamknięciu listy.
     *
     * @param prevProps - Właściwości komponentu przed aktualizacją.
     * @param prevState - Stan komponentu przed aktualizacją.
     */

    componentDidUpdate(prevProps: CustomSelectProps, prevState: CustomSelectState) {

        const areArraysEqual = (arr1: string[] = [], arr2: string[] = []): boolean => {
            if (arr1 === arr2) return true; // Same reference
            if (arr1.length !== arr2.length) return false;

            for (let i = 0; i < arr1.length; i++) {
                if (arr1[i] !== arr2[i]) return false;
            }
            return true;
        };
        const initialValuesChanged =
            prevProps.initialValues !== this.props.initialValues &&
            !areArraysEqual(prevProps.initialValues, this.props.initialValues);

        if (initialValuesChanged) {
            this.setState({
                selectedValues: new Set(this.props.initialValues)
            });
        }

        // Handle Open state changes
        if (this.state.isOpen && !prevState.isOpen) {
            this.calculatePosition();
            window.addEventListener('resize', this.calculatePosition);
            window.addEventListener('scroll', this.handleScroll, { capture: true });
            document.addEventListener('mousedown', this.handleOutsideClick);
            document.addEventListener('touchstart', this.handleOutsideClick);


            // Focus search if searchable
            if (this.props.searchable) {
                setTimeout(() => this.searchInputRef.current?.focus(), 50);
            }
        } else if (!this.state.isOpen && prevState.isOpen) {
            window.removeEventListener('resize', this.calculatePosition);
            window.removeEventListener('scroll', this.handleScroll, { capture: true });
            document.removeEventListener('mousedown', this.handleOutsideClick);
            document.removeEventListener('touchstart', this.handleOutsideClick);
            this.setState({ searchQuery: '', focusedIndex: -1 });
        }
    }

    /**
     * Metoda cyklu życia wywoływana bezpośrednio przed odmontowaniem i zniszczeniem komponentu.
     *
     * Odpowiada za ostateczne "sprzątanie":
     * 1. Usuwa wszystkie globalne nasłuchiwacze zdarzeń (`resize`, `scroll`, `mousedown`, `touchstart`),
     * które zostały podpięte do obiektu `window` lub `document` w momencie otwarcia listy.
     * 2. Zapobiega wyciekom pamięci (Memory Leaks) oraz błędom, które mogłyby wystąpić,
     * gdyby asynchroniczne zdarzenie spróbowało zaktualizować stan (`setState`) nieistniejącego już komponentu.
     */

    componentWillUnmount() {
        window.removeEventListener('resize', this.calculatePosition);
        window.removeEventListener('scroll', this.handleScroll, { capture: true });
        document.removeEventListener('mousedown', this.handleOutsideClick);
        document.removeEventListener('touchstart', this.handleOutsideClick);
    }

    getValue() {
        if (this.state.selectedValues.size === 0) {
            return {};
        }

        const valuesArray = Array.from(this.state.selectedValues);

        return {
            filter: {
                [this.props.filterKey]: valuesArray
            }
        };
    }

    static readonly DROPDOWN_MIN_WIDTH = 240;

    /**
     * Oblicza i aktualizuje pozycję absolutną (top, left) listy rozwijanej.
     * * Ponieważ dropdown jest renderowany w `Portal`,
     * nie dziedziczy pozycji rodzica i musi zostać pozycjonowany ręcznie.
     * Metoda ta dba również o to, aby lista nie "wyszła" poza krawędź ekranu (Viewport Collision Detection),
     * przesuwając ją w lewo, jeśli brakuje miejsca z prawej strony.
     */

    private calculatePosition = () => {
        if (!this.state.isOpen || !this.triggerRef.current) return;

        const rect = this.triggerRef.current.getBoundingClientRect();

        const minWidth = CustomSelect.DROPDOWN_MIN_WIDTH;

        let left = rect.left;

        if (left + minWidth > window.innerWidth) {
            left = Math.max(10, window.innerWidth - minWidth - 10);
        } else if (left < 10) {
            left = 10;
        }

        this.setState({
            position: {
                top: rect.bottom + 10,
                left: left,
                arrowLeft: (rect.left + rect.width / 2) - left
            }
        });
    };

    /**
     * Obsługuje kliknięcia poza obszarem komponentu (mechanizm "Click Outside").
     *
     * Metoda sprawdza, czy element, w który kliknął użytkownik (`event.target`),
     * znajduje się wewnątrz:
     * 1. Samej listy rozwijanej (`dropdownRef`) - aby nie zamykać listy, gdy użytkownik klika w jej suwak lub opcje.
     * 2. Przycisku otwierającego (`triggerRef`) - aby uniknąć konfliktu, gdy użytkownik klika w przycisk, żeby zamknąć listę.
     *
     * Jeśli kliknięcie nastąpiło poza tymi dwoma obszarami, lista jest zamykana (`isOpen: false`).
     *
     * @param event - Globalne zdarzenie DOM (mousedown lub touchstart) przechwycone z `document`.
     */

    private handleOutsideClick = (event: Event) => {
        const target = event.target as Node;
        // Check if click is inside dropdown or trigger
        const isDropdownClick = this.dropdownRef.current?.contains(target);
        const isTriggerClick = this.triggerRef.current?.contains(target);

        if (!isDropdownClick && !isTriggerClick) {
            this.setState({ isOpen: false });
        }
    };

    /**
     * Obsługuje globalne zdarzenie przewijania (`scroll`) przechwycone w fazie capture.
     *
     * Metoda ta pełni rolę filtra:
     * Sprawdza, czy użytkownik aktualnie wchodzi w interakcję z wnętrzem listy (np. przewija opcje klawiaturą lub myszką),
     * weryfikując, czy element posiadający focus (`document.activeElement`) znajduje się wewnątrz dropdownu.
     *
     * Jeśli tak, metoda przerywa działanie (`return`), aby zapobiec niepożądanemu zamknięciu listy,
     * co pozwala użytkownikowi swobodnie przewijać długą listę wyników bez jej znikania.
     */

    private handleScroll = () => {
        // Prevent closing if scrolling inside the dropdown
        if (this.state.isOpen && this.dropdownRef.current) {
            const activeEl = document.activeElement;
            if (activeEl && this.dropdownRef.current.contains(activeEl)) return;
        }
    };

    /**
     * Obsługuje zdarzenia klawiaturowe w celu zapewnienia dostępności i nawigacji po komponencie.
     *
     * Zachowanie:
     * - **Menu zamknięte**: Otwiera menu po naciśnięciu `Enter`, `Space` lub `ArrowDown`.
     * - **Menu otwarte**:
     * - `ArrowUp` / `ArrowDown`: Zmienia `focusedIndex` w granicach dostępnych dzieci.
     * - `Escape`: Zamyka menu.
     * - `Enter` / `Space`: Zatwierdza wybór aktualnie podświetlonego elementu (o ile `focusedIndex` jest poprawny).
     *
     * @note Jeśli prop `allowCustomRange` jest ustawiony na `true`, standardowa nawigacja jest pomijana,
     * aby umożliwić wpisywanie wartości niestandardowych.
     *
     * @param {React.KeyboardEvent} e - Zdarzenie klawiatury wywołane przez React.
     */

    private handleKeyDown = (e: React.KeyboardEvent) => {
        const { isOpen, focusedIndex } = this.state;

        if (!isOpen) {
            if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                this.setState({
                    isOpen: true,
                    focusedIndex: 0
                });
            }
            return;
        }

        if (this.props.allowCustomRange) return;

        const childrenCount = React.Children.count(this.props.children);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.setState(s => ({ focusedIndex: Math.min(s.focusedIndex + 1, childrenCount - 1) }));
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setState(s => ({ focusedIndex: Math.max(s.focusedIndex - 1, 0) }));
                break;
            case 'Escape':
                e.preventDefault();
                this.setState({ isOpen: false });
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (focusedIndex >= 0) {
                    const child = React.Children.toArray(this.props.children)[focusedIndex] as React.ReactElement<CustomOptionProps>;
                    if (child) {
                        const label = typeof child.props.children === 'string' ? child.props.children : String(child.props.value);
                        this.handleSelect(child.props.value, label);
                    }
                }
                break;
        }
    };

    /**
     * Obsługuje zdarzenie wyboru konkretnej opcji (kliknięcie lub Enter).
     *
     * Metoda realizuje następującą logikę:
     * 1. Rejestruje parę wartość-etykieta w `labelMap`, aby zapewnić poprawne wyświetlanie wybranej opcji.
     * 2. W trybie `allow_multiple`: dodaje wartość do zbioru lub ją usuwa (toggle).
     * 3. W trybie pojedynczym: nadpisuje wybór i zamyka listę rozwijaną.
     * 4. Wywołuje prop `onChange` przekazując zaktualizowaną tablicę wartości do rodzica.
     *
     * @param {string} value - Unikalny identyfikator wybranej opcji.
     * @param {string} label - Tekstowa reprezentacja opcji (wyświetlana użytkownikowi).
     */

    private handleSelect = (value: string, label: string) => {
        this.registerOption(value, label);

        let newSelected: Set<string>;
        if (this.props.allow_multiple) {
            newSelected = new Set(this.state.selectedValues);
            if (newSelected.has(value)) {
                newSelected.delete(value);
            } else {
                newSelected.add(value);
            }
            this.setState({ selectedValues: newSelected });
        } else {
            newSelected = new Set([value]);
            this.setState({ selectedValues: newSelected, isOpen: false });
        }

        if (this.props.onChange) {
            this.props.onChange(Array.from(newSelected));
        }
    };

    /**
     * Rejestruje mapowanie wartości na etykietę w stanie komponentu.
     *
     * Metoda ta jest wywoływana przez komponenty podrzędne (CustomOption) podczas ich montowania.
     * Dzięki temu rodzic (CustomSelect) wie, jaki tekst wyświetlić na przycisku (trigger),
     * gdy dana wartość znajduje się w zbiorze `selectedValues`.
     *
     * @param {string} value - Unikalny identyfikator opcji.
     * @param {string} label - Tekstowa reprezentacja opcji (to, co widzi użytkownik).
     */

    private registerOption = (value: string, label: string) => {
        this.setState(prev => ({
            labelMap: new Map(prev.labelMap).set(value, label)
        }));
    };

    /**
     * Ustawia indeks elementu, który ma zostać wizualnie podświetlony (otrzymać focus).
     *
     * Metoda aktualizuje stan `focusedIndex`. Jest przekazywana do kontekstu (`SelectContext`),
     * co umożliwia komponentom potomnym (`CustomOption`) zmianę aktywnego elementu
     * w momencie najechania na nie kursorem myszy (`onMouseEnter`).
     *
     * @param {number} index - Nowy indeks podświetlonego elementu (liczony od 0).
     */

    private setFocusedIndex = (index: number) => {
        this.setState({ focusedIndex: index });
    };

    /**
     * Generuje wewnętrzną zawartość listy rozwijanej (dropdownu).
     *
     * Metoda ta pełni rolę "kontrolera widoku" dla wnętrza listy i odpowiada za:
     * 1. Wybór trybu wyświetlania: standardowa lista opcji lub panel zakresu dat (`allowCustomRange`).
     * 2. Logikę wyszukiwania: filtrowanie opcji na podstawie `searchQuery`.
     * 3. Logikę sortowania: szeregowanie wyników tak, aby te zaczynające się od wpisanej frazy były wyżej.
     * 4. Obsługę stanów brzegowych: brak zdefiniowanych opcji lub brak wyników wyszukiwania.
     *
     * @returns {React.ReactNode} Elementy JSX (input, lista opcji lub komunikaty) gotowe do wstawienia do portalu.
     */

    private renderContent() {
        const { children, searchable, allowCustomRange } = this.props;
        const { searchQuery } = this.state;

        if (allowCustomRange) {
            return <DateRangePanel onConfirm={this.handleSelect} />;
        }

        const arrayChildren = React.Children.toArray(children);

        if (arrayChildren.length === 0) {
            return <div className="options-list"><div className="empty-state">Brak opcji</div></div>;
        }

        const getTextFromChild = (child: React.ReactNode): string => {
            if (!React.isValidElement(child)) return "";
            const props = child.props as CustomOptionProps;
            return typeof props.children === 'string'
                ? props.children
                : (props.value ? String(props.value) : "");
        };

        const lowerQuery = searchQuery.toLowerCase();

        const visibleChildren = arrayChildren.filter((child) => {
            if (!React.isValidElement(child)) return false;
            if (!searchable || !searchQuery) return true;

            return getTextFromChild(child).toLowerCase().includes(lowerQuery);
        });

        if (searchable && searchQuery) {
            visibleChildren.sort((a, b) => {
                const textA = getTextFromChild(a).toLowerCase();
                const textB = getTextFromChild(b).toLowerCase();

                const indexA = textA.indexOf(lowerQuery);
                const indexB = textB.indexOf(lowerQuery);

                if (indexA !== indexB) {
                    return indexA - indexB;
                }

                return textA.length - textB.length;
            });
        }

        return (
            <>
                {searchable && (
                    <div className="search-container">
                        <div className="search-icon-wrapper"><SearchIcon /></div>
                        <input
                            ref={this.searchInputRef}
                            className="search-input"
                            placeholder="Szukaj..."
                            value={searchQuery}
                            onChange={(e) => this.setState({ searchQuery: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                <div className="options-list">
                    {searchable && searchQuery && visibleChildren.length === 0 ? (
                        <div className="empty-state">Brak wyników</div>
                    ) : (
                        visibleChildren.map((child, index) =>
                            React.cloneElement(child as React.ReactElement<any>, { index })
                        )
                    )}
                </div>
            </>
        );
    }
    render() {
        const { label, allow_multiple, className, menu_mode } = this.props;
        const { isOpen, selectedValues, labelMap, position } = this.state;

        const isActive = selectedValues.size > 0;
        const firstVal = isActive ? Array.from(selectedValues)[0] : null;
        const displayLabel = firstVal ? (labelMap.get(firstVal) || firstVal) : null;
        const displayCount = selectedValues.size > 1 ? ` +${selectedValues.size - 1}` : '';

        return (
                <div
                    ref={this.triggerRef}
                    onClick={() => this.setState({ isOpen: !isOpen, focusedIndex: -1})}
                    onKeyDown={this.handleKeyDown}
                    className={`custom-select-trigger ${isActive ? 'filtered' : ''} ${className || ''}`}
                    role="button"
                    tabIndex={0}
                >
                    {label}
                    {isActive && !menu_mode && (
                        <div>{displayLabel}{allow_multiple && displayCount}</div>
                    )}

                {isOpen && position && createPortal(
                    <div
                        id="active-dropdown"
                        ref={this.dropdownRef}
                        className="select-dropdown"
                        style={{
                            top: position.top,
                            left: position.left,
                            '--arrow-left': `${position.arrowLeft}px`,
                            width: 'auto',
                            minWidth: CustomSelect.DROPDOWN_MIN_WIDTH
                        } as React.CSSProperties}
                    >
                        <SelectContext.Provider value={{
                            selectedValues: this.state.selectedValues,
                            onSelect: this.handleSelect,
                            searchQuery: this.state.searchQuery,
                            focusedIndex: this.state.focusedIndex,
                            setFocusedIndex: this.setFocusedIndex,
                            registerOption: this.registerOption
                        }}>
                            {this.renderContent()}
                        </SelectContext.Provider>
                    </div>,
                    document.body
                )}
            </div>
        );
    }
}

/**
 * Definicja właściwości (props) dla komponentu `DateRangePanel`.
 */

interface DateRangePanelProps {
    onConfirm: (value: string, label: string) => void;
}

/**
 * Komponent panelu pozwalający użytkownikowi na ręczne wprowadzenie zakresu lat.
 *
 * Główne funkcjonalności:
 * - **Restrykcyjne inputy**: Pozwala wpisywać tylko cyfry, do maksymalnie 4 znaków.
 * - **Walidacja**: Wymaga podania pełnych, 4-cyfrowych lat przed zatwierdzeniem.
 * - **Auto-korekta kolejności**: Jeśli rok "Od" jest większy niż rok "Do",
 * komponent automatycznie zamienia je miejscami przy zatwierdzaniu.
 *
 * @param {DateRangePanelProps} props - Właściwości komponentu.
 * @param {function} props.onConfirm - Callback wywoływany po poprawnym zatwierdzeniu formularza.
 * Przyjmuje dwa argumenty:
 * 1. `value` (string).
 * 2. `label` (string).
 */

const DateRangePanel = ({ onConfirm }: DateRangePanelProps) => {
    const [start, setStart] = React.useState('');
    const [end, setEnd] = React.useState('');

    const [error, setError] = React.useState<string | null>(null);

    const handleInput = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        if (error) setError(null);

        if (val === '' || (/^\d+$/.test(val) && val.length <= 4)) setter(val);
    };

    const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!start || !end) return;

        // Optional
        if (start.length < 4 || end.length < 4) {
            setError("Wpisz pełne lata (4 cyfry).");
            return;
        }

        const startYear = parseInt(start, 10);
        const endYear = parseInt(end, 10);


        if (startYear > endYear) {
            onConfirm(`${end}-${start}`, `${end} - ${start}`);
            return;
        }

        onConfirm(`${start}-${end}`, `${start} - ${end}`);
    };

    return (
        <div className="date-range-dropdown-content">
            <div className="date-input-group-sm">
                <label>Od roku:</label>
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY"
                    value={start}
                    onChange={handleInput(setStart)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className={error ? 'input-error' : ''} // Opcjonalna klasa błędu
                />
            </div>
            <div className="date-input-group-sm">
                <label>Do roku:</label>
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY"
                    value={end}
                    onChange={handleInput(setEnd)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className={error ? 'input-error' : ''}
                />
            </div>

            {/* Wyświetlanie błędu */}
            {error && <div style={{ color: 'white', fontSize: '11px', marginBottom: '5px' }}>{error}</div>}

            <button
                className="date-confirm-btn-sm"
                disabled={!start || !end}
                style={{
                    opacity: (!start || !end) ? 0.5 : 1,
                    cursor: (!start || !end) ? 'not-allowed' : 'pointer'
                }}
                onClick={handleConfirm}
            >
                Zatwierdź
            </button>
        </div>
    );
};