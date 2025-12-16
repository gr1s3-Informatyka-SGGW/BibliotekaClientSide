/**
 * @file Implementuje komponent opcji sortowania z opcją wyszukiwania i wielokrotnego wyboru
 * @author Karol Dziuba
 */
/**
* CustomSelect.css, style.css, input.css
*/

import React, { Component, createRef } from 'react';
import { createPortal } from 'react-dom';
import type IFormComponent from "./IFormComponent.tsx";

const SearchIcon = ({ className = "" }: { className?: string }) => (
    <img
        src="src/assets/search.svg"
        alt=""
        className={className}
        style={{ filter: 'invert(19%) sepia(43%) saturate(3686%) hue-rotate(314deg) brightness(91%) contrast(98%)' }}
    />
);

export const FilterResetButton = ({ activeCount = 0, onReset, label = "Wyczyść filtry" }: { activeCount?: number; onReset: () => void; label?: string; }) => (
    <div className="filtered filter-reset-btn" onClick={onReset} role="button" tabIndex={0}>
        {label} ({activeCount})
    </div>
);

export const FilterSeparator = () => <div className="separator"></div>;

// Context for Parent-Child Communication

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
 */
export interface CustomOptionProps {
    value: string;
    children: string | React.ReactNode;
    className?: string;
    index?: number;
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
}

interface CustomSelectState {
    isOpen: boolean;
    selectedValues: Set<string>;
    labelMap: Map<string, string>;
    searchQuery: string;
    focusedIndex: number;
    position: { top: number; left: number; arrowLeft: number } | null;
}

// Components

/**
 * Komponent reprezentujący pojedynczą opcję na liście rozwijanej.
 * Rejestruje się w kontekście rodzica i obsługuje interakcje myszką.
 */
export class CustomOption extends Component<CustomOptionProps> {
    private elementRef = createRef<HTMLDivElement>();

    static contextType = SelectContext;
    declare context: React.ContextType<typeof SelectContext>;

    componentDidMount() {
        const textContent = typeof this.props.children === 'string'
            ? this.props.children
            : String(this.props.value);

        this.context?.registerOption(this.props.value, textContent);
    }

    handleMouseEnter = () => {
        if (typeof this.props.index === 'number') {
            this.context?.setFocusedIndex(this.props.index);
        }
    };

    handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const textContent = typeof this.props.children === 'string' ? this.props.children : String(this.props.value);
        this.context?.onSelect(this.props.value, textContent);
    };

    render() {
        if (!this.context) return null;

        const { selectedValues, searchQuery, focusedIndex } = this.context;
        const { value, children, className, index } = this.props;

        const isSelected = selectedValues.has(value);
        const textContent = typeof children === 'string' ? children : '';
        const isFocused = focusedIndex === index;

        // Filter logic based on search
        if (searchQuery && textContent && !textContent.toLowerCase().includes(searchQuery.toLowerCase())) {
            return null;
        }

        return (
            <div
                ref={this.elementRef}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={this.handleClick}
                onMouseEnter={this.handleMouseEnter}
                className={`option-item ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''} ${className || ''}`}
            >
                <span className="truncate">{children}</span>
            </div>
        );
    }
}

/**
 * Komponent główny listy rozwijanej.
 * Obsługuje logikę otwierania/zamykania, pozycjonowania, filtrowania opcji i zarządzania stanem wyboru.
 */
export class CustomSelect extends Component<CustomSelectProps, CustomSelectState> implements IFormComponent<string[]> {
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

    componentDidUpdate(prevProps: CustomSelectProps, prevState: CustomSelectState) {
        // Sync initialValues prop change
        if (prevProps.initialValues !== this.props.initialValues) {
            this.setState(current => {
                const next = new Set(this.props.initialValues);
                // Simple equality check for Set
                if (current.selectedValues.size === next.size && [...next].every(x => current.selectedValues.has(x))) {
                    return null;
                }
                return { selectedValues: next };
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

    componentWillUnmount() {
        window.removeEventListener('resize', this.calculatePosition);
        window.removeEventListener('scroll', this.handleScroll, { capture: true });
        document.removeEventListener('mousedown', this.handleOutsideClick);
        document.removeEventListener('touchstart', this.handleOutsideClick);
    }

    getValue(): string[] {
        return Array.from(this.state.selectedValues);
    }

    private calculatePosition = () => {
        if (!this.state.isOpen || !this.triggerRef.current) return;

        const rect = this.triggerRef.current.getBoundingClientRect();
        const DROPDOWN_MIN_WIDTH = 300;

        let left = rect.left;
        // Logic to keep inside viewport
        if (left + DROPDOWN_MIN_WIDTH > window.innerWidth) {
            left = Math.max(10, window.innerWidth - DROPDOWN_MIN_WIDTH - 10);
        } else if (left < 10) {
            left = 10;
        }

        this.setState({
            position: {
                top: rect.bottom + 20,
                left: left,
                arrowLeft: (rect.left + rect.width / 2) - left
            }
        });
    };

    private handleOutsideClick = (event: Event) => {
        const target = event.target as Node;
        // Check if click is inside dropdown or trigger
        const isDropdownClick = this.dropdownRef.current?.contains(target);
        const isTriggerClick = this.triggerRef.current?.contains(target);

        if (!isDropdownClick && !isTriggerClick) {
            this.setState({ isOpen: false });
        }
    };

    private handleScroll = () => {
        // Prevent closing if scrolling inside the dropdown
        if (this.state.isOpen && this.dropdownRef.current) {
            const activeEl = document.activeElement;
            if (activeEl && this.dropdownRef.current.contains(activeEl)) return;
        }
    };

    private handleKeyDown = (e: React.KeyboardEvent) => {
        const { isOpen, focusedIndex } = this.state;

        if (!isOpen) {
            if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
                this.setState({ isOpen: true });
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

    private registerOption = (value: string, label: string) => {
        this.setState(prev => ({
            labelMap: new Map(prev.labelMap).set(value, label)
        }));
    };

    private setFocusedIndex = (index: number) => {
        this.setState({ focusedIndex: index });
    };

    private renderContent() {
        const { children, searchable, allowCustomRange } = this.props;
        const { searchQuery } = this.state;

        if (allowCustomRange) {
            return <DateRangePanel onConfirm={this.handleSelect} />;
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
                    {React.Children.count(children) === 0 ? (
                        <div className="empty-state">Brak opcji</div>
                    ) : (
                        React.Children.map(children, (child, index) =>
                            React.isValidElement(child)
                                ? React.cloneElement(child as React.ReactElement<any>, { index })
                                : child
                        )
                    )}

                    {searchable && searchQuery &&
                        React.Children.toArray(children).every((c: any) =>
                            !String(c.props.children).toLowerCase().includes(searchQuery.toLowerCase())
                        ) && (
                            <div className="empty-state">Brak wyników</div>
                        )}
                </div>
            </>
        );
    }

    render() {
        const { label, allow_multiple, className } = this.props;
        const { isOpen, selectedValues, labelMap, position } = this.state;

        const isActive = selectedValues.size > 0;
        const firstVal = isActive ? Array.from(selectedValues)[0] : null;
        const displayLabel = firstVal ? (labelMap.get(firstVal) || firstVal) : null;
        const displayCount = selectedValues.size > 1 ? ` +${selectedValues.size - 1}` : '';

        return (
            <>
                <div
                    ref={this.triggerRef}
                    onClick={() => this.setState({ isOpen: !isOpen })}
                    onKeyDown={this.handleKeyDown}
                    className={`${isActive ? 'filtered' : ''} ${className || ''}`}
                    role="button"
                    tabIndex={0}
                >
                    {label}
                    {isActive && (
                        <div>{displayLabel}{allow_multiple && displayCount}</div>
                    )}
                </div>

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
                            minWidth: '240px'
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
            </>
        );
    }
}

/**
 * Wariant CustomSelect, który ma włączone wyszukiwanie.
 */
export class SearchableSelect extends CustomSelect {
    static defaultProps = {
        searchable: true
    };

    render() {
        return super.render();
    }
}

// Internal Helper for Date Range

interface DateRangePanelProps {
    onConfirm: (value: string, label: string) => void;
}

const DateRangePanel = ({ onConfirm }: DateRangePanelProps) => {
    const [start, setStart] = React.useState('');
    const [end, setEnd] = React.useState('');

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