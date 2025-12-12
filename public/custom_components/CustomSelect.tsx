/**
 * @file Implementuje komponent filtrujący książki, poprzez dane podane przez użytkownika
 * @author Karol Dziuba
 * */

import React, { useState, useRef, useEffect, isValidElement, useCallback } from 'react';
import { createPortal } from 'react-dom';

// Icons

/**
 * Komponent ikony lupy (SVG).
 * Używany w pasku wyszukiwania wewnątrz dropdowna.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */

const SearchIcon = ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
);

// Context

/**
 * Definicja kontekstu współdzielonego między CustomSelect a jego dziećmi (CustomOption).
 *
 * @property {Set<string>} selectedValues - Zbiór aktualnie wybranych wartości
 * @property {(value: string, label: string) => void} onSelect - Funkcja wywoływana po kliknięciu opcji
 * @property {string} searchQuery - Aktualna fraza wyszukiwania
 * @property {number} focusedIndex - Indeks aktualnie podświetlonej opcji (nawigacja klawiaturą)
 * @property {(index: number) => void} setFocusedIndex - Ustawia indeks podświetlonej opcji
 * @property {React.MutableRefObject<(HTMLDivElement | null)[]>} optionsRefs - Referencje do elementów DOM opcji (dla scrollowania)
 */
interface SelectContextType {
    selectedValues: Set<string>;
    onSelect: (value: string, label: string) => void;
    searchQuery: string;
    focusedIndex: number;
    setFocusedIndex: (index: number) => void;
    optionsRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}
const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

/**
 * Przycisk resetujący wszystkie filtry.
 *
 * @param {object} props
 * @param {number} [props.activeCount=0] - Liczba aktywnych filtrów (wyświetlana w nawiasie)
 * @param {() => void} props.onReset - Funkcja czyszcząca filtry
 * @param {string} [props.label="Wyczyść filtry"] - Etykieta przycisku
 * @returns {JSX.Element}
 */

export const FilterResetButton = ({ activeCount = 0, onReset, label = "Wyczyść filtry" }: { activeCount?: number; onReset: () => void; label?: string; }) => (
    <button type="button" className="select-trigger filter-reset-btn" onClick={onReset}>
        {label} ({activeCount})
    </button>
);

/**
 * Wizualny separator pionowy oddzielający grupy filtrów.
 * @returns {JSX.Element}
 */

export const FilterSeparator = () => <div className="filter-separator"></div>;

// Date Range Panel

/**
 * Typy propsów dla komponentu DateRangePanel
 *
 * @property {(value: string, label: string) => void} onConfirm - Callback wywoływany po zatwierdzeniu zakresu dat
 */
interface DateRangePanelProps {
    onConfirm: (value: string, label: string) => void;
}

/**
 * Komponent panelu do wprowadzania zakresu dat (Od roku - Do roku).
 * Waliduje, czy wprowadzono liczby i blokuje przycisk, jeśli pola są puste.
 *
 * @param {DateRangePanelProps} props
 * @returns {JSX.Element}
 */

const DateRangePanel: React.FC<DateRangePanelProps> = ({ onConfirm }) => {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    const handleInput = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || (/^\d+$/.test(val) && val.length <= 4)) setter(val);
    };

    const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (start && end) onConfirm(`${start}-${end}`, `${start} - ${end}`);
    };

    return (
        <div className="date-range-dropdown-content">
            <div className="date-input-group-sm">
                <label>Od roku:</label>
                <input type="text" inputMode="numeric" placeholder="YYYY" value={start} onChange={handleInput(setStart)} onClick={e => e.stopPropagation()} />
            </div>
            <div className="date-input-group-sm">
                <label>Do roku:</label>
                <input type="text" inputMode="numeric" placeholder="YYYY" value={end} onChange={handleInput(setEnd)} onClick={e => e.stopPropagation()} />
            </div>
            <button
                className="date-confirm-btn-sm"
                disabled={!start || !end}
                style={{ opacity: (!start || !end) ? 0.5 : 1, cursor: (!start || !end) ? 'not-allowed' : 'pointer' }}
                onClick={handleConfirm}
            >
                Zatwierdź
            </button>
        </div>
    );
};

// Custom Option

/**
 * Typy propsów dla komponentu CustomOption
 *
 * @property {string} value - Unikalna wartość opcji
 * @property {React.ReactNode} children - Treść wyświetlana
 * @property {string} [className] - Opcjonalna klasa CSS
 * @property {number} [index] - Indeks opcji na liście, wstrzykiwany przez rodzica
 */
export interface CustomOptionProps {
    value: string;
    children: React.ReactNode;
    className?: string;
    index?: number;
}

/**
 * Pojedyncza opcja wewnątrz dropdowna CustomSelect.
 * Obsługuje zaznaczanie, podświetlanie i filtrowanie po wyszukiwaniu.
 *
 * @param {CustomOptionProps} props
 * @returns {JSX.Element | null}
 */

export const CustomOption: React.FC<CustomOptionProps> = ({ value, children, className, index }) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error('CustomOption must be used within a CustomSelect');

    const { selectedValues, onSelect, searchQuery, focusedIndex, setFocusedIndex, optionsRefs } = context;
    const isSelected = selectedValues.has(value);
    const textContent = typeof children === 'string' ? children : '';

    // Filter logic
    if (searchQuery && textContent && !textContent.toLowerCase().includes(searchQuery.toLowerCase())) return null;

    return (
        <div
            ref={(el) => { if (typeof index === 'number' && optionsRefs.current) optionsRefs.current[index] = el; }}
            role="option"
            aria-selected={isSelected}
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onSelect(value, textContent); }}
            onMouseEnter={() => typeof index === 'number' && setFocusedIndex(index)}
            className={`option-item ${isSelected ? 'selected' : ''} ${focusedIndex === index ? 'focused' : ''} ${className || ''}`}
        >
            <span className="truncate">{children}</span>
        </div>
    );
};

// Main Component

/**
 * Typy propsów dla komponentu CustomSelect
 *
 * @property {React.ReactNode} [children] - Opcje (CustomOption) lub inne elementy React
 * @property {string} label - Etykieta wyświetlana na przycisku
 * @property {boolean} [allow_multiple] - Czy można wybrać więcej niż jedną opcję?
 * @property {boolean} [searchable] - Czy pokazać pole wyszukiwania wewnątrz dropdowna?
 * @property {(values: string[]) => void} [onChange] - Callback wywoływany przy zmianie wyboru. Zwraca tablicę wybranych wartości (string[])
 * @property {string[]} [initialValues] - Tablica wartości zaznaczonych początkowo
 * @property {string} [className] - Dodatkowa klasa CSS dla kontenera
 * @property {boolean} [allowCustomRange] - Czy włączyć tryb wyboru zakresu dat (zastępuje standardowe opcje formularzem)?
 */

export interface CustomSelectProps {
    children?: React.ReactNode;
    label: string;
    allow_multiple?: boolean;
    searchable?: boolean;
    onChange?: (values: string[]) => void;
    initialValues?: string[];
    className?: string;
    allowCustomRange?: boolean;
}
/**
 * Główny komponent Select (Dropdown).
 *
 * Funkcjonalności:
 * - Otwieranie/zamykanie dropdowna (Portal)
 * - Obsługa wyboru pojedynczego i wielokrotnego
 * - Wyszukiwanie opcji
 * - Specjalny tryb zakresu dat (allowCustomRange)
 * - Nawigacja klawiaturą (strzałki, Enter, Escape)
 * - Pozycjonowanie względem krawędzi ekranu
 * - Zamykanie po kliknięciu poza komponent (Click Outside)
 *
 * @param {CustomSelectProps} props
 * @returns {JSX.Element}
 */

export const CustomSelect: React.FC<CustomSelectProps> = ({
                                                              children, label, allow_multiple = false, searchable = false, onChange, initialValues = [], className, allowCustomRange = false
                                                          }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set(initialValues));
    const [labelMap, setLabelMap] = useState<Map<string, string>>(new Map());
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [position, setPosition] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionsRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Sync initial values
    useEffect(() => {
        setSelectedValues(prev => {
            const next = new Set(initialValues);
            return (prev.size === next.size && [...next].every(x => prev.has(x))) ? prev : next;
        });
    }, [initialValues]);

    // Build label map from children
    useEffect(() => {
        const newMap = new Map<string, string>();
        React.Children.forEach(children, (child) => {
            if (isValidElement<CustomOptionProps>(child)) {
                newMap.set(child.props.value, child.props.children?.toString() || child.props.value);
            }
        });
        setLabelMap(newMap);
    }, [children]);

    // Positioning Logic
    const calculatePosition = useCallback(() => {
        if (!isOpen || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const DROPDOWN_MIN_WIDTH = 300;

        let left = rect.left;
        if (left + DROPDOWN_MIN_WIDTH > window.innerWidth) left = Math.max(10, window.innerWidth - DROPDOWN_MIN_WIDTH - 10);
        else if (left < 10) left = 10;

        setPosition({
            top: rect.bottom + 16,
            left,
            arrowLeft: (rect.left + rect.width / 2) - left
        });
    }, [isOpen]);

    useEffect(() => {
        calculatePosition();
        window.addEventListener('resize', calculatePosition);
        return () => window.removeEventListener('resize', calculatePosition);
    }, [calculatePosition]);

    // Auto-focus search
    useEffect(() => {
        if (isOpen && searchable) setTimeout(() => searchInputRef.current?.focus(), 50);
        else setFocusedIndex(-1);
    }, [isOpen, searchable]);

    // Scroll & Click Outside handler
    useEffect(() => {
        if (!isOpen) return;
        const handleInteraction = (event: Event) => {
            const dropdown = document.getElementById('active-dropdown');
            const target = event.target as Node;

            if (event.type === 'scroll') {
                const activeEl = document.activeElement;
                if (activeEl && dropdown?.contains(activeEl)) {
                    return;
                }
            }

            const clickedInside = dropdown?.contains(target) || containerRef.current?.contains(target);

            if (clickedInside) return;

            setIsOpen(false);
            setSearchQuery('');
        };

        window.addEventListener('scroll', handleInteraction, { capture: true });
        document.addEventListener('mousedown', handleInteraction);
        document.addEventListener('touchstart', handleInteraction); // Added touchstart for mobile
        return () => {
            window.removeEventListener('scroll', handleInteraction, { capture: true });
            document.removeEventListener('mousedown', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && optionsRefs.current[focusedIndex]) {
            optionsRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [focusedIndex, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
                e.preventDefault(); setIsOpen(true);
            }
            return;
        }
        if (allowCustomRange) return;

        const count = React.Children.count(children);
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, count - 1)); break;
            case 'ArrowUp': e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); break;
            case 'Escape': e.preventDefault(); setIsOpen(false); break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (focusedIndex >= 0) {
                    const child = React.Children.toArray(children)[focusedIndex] as React.ReactElement<CustomOptionProps>;
                    if (child) handleSelect(child.props.value, child.props.children?.toString() || child.props.value);
                }
                break;
        }
    };

    const handleSelect = (value: string, labelStr: string) => {
        setLabelMap(prev => new Map(prev).set(value, labelStr));

        let newSelected: Set<string>;
        if (allow_multiple) {
            newSelected = new Set(selectedValues);
            newSelected.has(value) ? newSelected.delete(value) : newSelected.add(value);
        } else {
            newSelected = new Set([value]);
            setIsOpen(false);
        }

        setSelectedValues(newSelected);
        onChange?.(Array.from(newSelected));
    };

    // Render helpers
    const isActive = selectedValues.size > 0;
    const firstVal = isActive ? Array.from(selectedValues)[0] : null;
    const displayLabel = firstVal ? (labelMap.get(firstVal) || firstVal) : label;
    const displayCount = selectedValues.size > 1 ? ` +${selectedValues.size - 1}` : '';

    return (
        <div ref={containerRef} className={`custom-select-container ${className || ''}`} onKeyDown={handleKeyDown}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`select-trigger ${isActive ? 'active' : 'inactive'}`}
                aria-expanded={isOpen}
            >
                {isActive ? (
                    <div className="select-content">
                        <span className="select-label">{label}</span>
                        <span className="select-value">{displayLabel}{allow_multiple && displayCount}</span>
                    </div>
                ) : (
                    <span className="simple-label">{label}</span>
                )}
            </button>

            {isOpen && position && createPortal(
                <div
                    id="active-dropdown"
                    className="select-dropdown"
                    style={{ top: position.top, left: position.left, '--arrow-left': `${position.arrowLeft}px` } as React.CSSProperties}
                >
                    <SelectContext.Provider value={{
                        selectedValues, onSelect: handleSelect, searchQuery, focusedIndex, setFocusedIndex, optionsRefs
                    }}>
                        {allowCustomRange ? (
                            <DateRangePanel onConfirm={handleSelect} />
                        ) : (
                            <>
                                {searchable && (
                                    <div className="search-container">
                                        <div className="search-icon-wrapper"><SearchIcon /></div>
                                        <input
                                            ref={searchInputRef}
                                            className="search-input"
                                            placeholder="Szukaj..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                )}
                                <div className="options-list">
                                    {React.Children.count(children) === 0 ? <div className="empty-state">Brak opcji</div> :
                                        React.Children.map(children, (child, index) =>
                                            isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { index }) : child
                                        )
                                    }
                                    {searchable && searchQuery &&
                                        React.Children.toArray(children).every((c: any) =>
                                            !c.props.children?.toString().toLowerCase().includes(searchQuery.toLowerCase())
                                        ) && <div className="empty-state">Brak wyników</div>
                                    }
                                </div>
                            </>
                        )}
                    </SelectContext.Provider>
                </div>,
                document.body
            )}
        </div>
    );
};