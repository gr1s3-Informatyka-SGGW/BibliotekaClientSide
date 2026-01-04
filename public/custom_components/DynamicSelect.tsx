
import React, { Component, createRef } from "react";
import type IFormComponent from "./IFormComponent";

interface ChipProps {
    label: string;
    onRemove: () => void;
    isAddButton?: boolean;
}

/**
 * Komponent reprezentujący pojedynczą wybraną etykietę (chip) lub przycisk akcji.
 * @param {ChipProps} props - Właściwości komponentu.
 * @param {string} props.label - Tekst wyświetlany na chipie.
 * @param {Function} props.onRemove - Funkcja wywoływana przy usuwaniu lub kliknięciu przycisku.
 * @param {boolean} [props.isAddButton] - Jeśli true, chip stylizowany jest jako przycisk "Dodaj".
 */
const Chip: React.FC<ChipProps> = ({ label, onRemove, isAddButton = false }: ChipProps) => {
    const className = isAddButton ? "chip add" : "chip";

    return (
        <div
            className={className}
            onClick={(e) => {
                e.preventDefault(); // Kluczowe, by nie odświeżać strony u managera
                onRemove();
            }}
            role="button" // Sugestia dla przeglądarki, że to element klikalny
            style={{ cursor: 'pointer' }}
        >
            {label}
            {!isAddButton && <span className="chip-close">x</span>}
        </div>
    );
};

/**
 *Interfejs definiujący właściwości komponentu DynamicSelect.
 * @interface DynamicSelectProps
 * @property {string} label - Napis wyświetlany nad polem.
 * @property {string} id - Identyfikator dla inputu i labela.
 * @property {string[]} [children] - Tablica stringów stanowiąca listę opcji do wyboru.
 * @property {boolean} [allow_multiple] - Jeśli true, można wybrać wiele tagów.
 * @property {string} [placeholder] - Tekst wyświetlany, gdy pole jest puste.
 * @property {string[] | string} [default_value] - Początkowo wybrane elementy.
 */
interface DynamicSelectProps {
    label: string;
    id: string;
    children?: string[];
    allow_multiple?: boolean;
    placeholder?: string;
    default_value?: string[] | string;
}
/**
 * Interfejs definiujący stan wewnętrzny komponentu DynamicSelect.
 * @interface DynamicSelectState
 * @property {string} searchTerm - Aktualnie wpisana fraza w polu wyszukiwania.
 * @property {boolean} isDropdownOpen - Czy lista z podpowiedziami jest widoczna.
 * @property {string[]} selectedItems - Lista wybranych elementów (tylko dla allow_multiple=true).
 * @property {string} selectedValue - Wybrana pojedyncza wartość (tylko dla allow_multiple=false).
 */
interface DynamicSelectState {
    searchTerm: string;
    isDropdownOpen: boolean;
    selectedItems: string[];
    selectedValue: string;
}
/**
 * Style CSS dla inputa selecta.
 * Ukrywają natywną strzałkę i zastępują ją własną ikoną SVG.
 */
const arrowStyle: React.CSSProperties = {
    appearance: "none",
    backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" width="292.4" height="292.4" fill="%23891E49"><path d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-4.9 0-9.4 1.8-13 5.4a17.6 17.6 0 0 0 0 24.1l128 128a17.6 17.6 0 0 0 24.1 0l128-128a17.6 17.6 0 0 0 0-24.1z"/></svg>')`,
    backgroundPosition: "right 12px top 50%",
    backgroundRepeat: "no-repeat",
    backgroundSize: "0.7em auto",
    paddingRight: "35px"
};

/**
 * Dynamiczny komponent wyboru (select) obsługujący wyszukiwanie, 
 * wybór wielokrotny oraz dodawanie nowych pozycji.
 * Implementuje interfejs IFormComponent.
 * @extends {Component<DynamicSelectProps, DynamicSelectState>}
 * @implements {IFormComponent<string[] | string>}
 */
export default class DynamicSelect
    extends Component<DynamicSelectProps, DynamicSelectState>
    implements IFormComponent<string[] | string> {

    /**
 * Referencja do głównego kontenera komponentu.
 * Wykorzystywana do wykrywania kliknięć poza komponentem
 * w celu zamknięcia listy rozwijanej (dropdown).
 */
    private containerRef = createRef<HTMLDivElement>();

    /**
 * Tworzy nową instancję komponentu DynamicSelect.
 * Inicjalizuje stan na podstawie przekazanych propsów,
 * w tym wartości domyślnych oraz trybu single/multi select.
 * 
 * @param {DynamicSelectProps} props - Właściwości przekazane do komponentu.
 */
    constructor(props: DynamicSelectProps) {
        super(props);

        const isMultiple = props.allow_multiple ?? true;
        const defaultValue = props.default_value;

        this.state = {
            searchTerm: !isMultiple && typeof defaultValue === "string" ? defaultValue : "",
            isDropdownOpen: false,
            selectedItems: isMultiple && Array.isArray(defaultValue) ? defaultValue : [],
            selectedValue: !isMultiple && typeof defaultValue === "string" ? defaultValue : ""
        };
    }

    /**
     * Zwraca aktualnie wybrane wartości z komponentu.
     * @returns {string[] | string} - Jeśli `allow_multiple` = true, zwraca tablicę wybranych elementów,
     *                                 w przeciwnym wypadku pojedynczą wartość.
     */
    getValue(): string[] | string {
        return this.props.allow_multiple
            ? this.state.selectedItems
            : this.state.selectedValue;
    }

    /**
     * Rejestruje globalny nasłuch zdarzeń kliknięcia myszą,
     * aby móc zamykać dropdown po kliknięciu poza komponentem.
     */
    componentDidMount() {
        document.addEventListener("mousedown", this.handleClickOutside);
    }

    /**
     * Synchronizuje lokalny stan komponentu z nowymi propsami.
     * Reaguje na zmianę `default_value`, co pozwala na ustawienie wartości 
     * domyślnej nawet po zamontowaniu komponentu (np. po pobraniu danych z API).
     * * @param {DynamicSelectProps} prevProps - Poprzednie właściwości komponentu.
     */
    componentDidUpdate(prevProps: DynamicSelectProps) {
        if (prevProps.default_value !== this.props.default_value) {
            const isMultiple = this.props.allow_multiple ?? true;
            const val = this.props.default_value;

            if (isMultiple && Array.isArray(val)) {
                this.setState({ selectedItems: val });
            } else if (!isMultiple && typeof val === "string") {
                this.setState({
                    selectedValue: val,
                    searchTerm: val
                });
            }
        }
    }

    /**
     * Usuwa globalny nasłuch zdarzeń kliknięcia myszą przy odmontowaniu komponentu.
     */
    componentWillUnmount() {
        document.removeEventListener("mousedown", this.handleClickOutside);
    }
    /**
     * Obsługuje kliknięcia poza komponentem, aby zamknąć listę rozwijaną.
     * @param {MouseEvent} event - Obiekt zdarzenia myszy.
     */
    handleClickOutside = (event: MouseEvent) => {
        if (
            this.containerRef.current &&
            !this.containerRef.current.contains(event.target as Node)
        ) {
            this.setState({
                isDropdownOpen: false,
                searchTerm: this.props.allow_multiple
                    ? ""
                    : this.state.selectedValue
            });
        }
    };
    /**
     * Zwraca opcje pasujące do wpisanego terminu wyszukiwania.
     * W przypadku wyboru wielokrotnego filtruje już wybrane elementy.
     * @returns {string[]} - Lista pasujących opcji.
     */
    getFilteredOptions(): string[] {
        const { children = [], allow_multiple } = this.props;
        const { searchTerm, selectedValue } = this.state;
        const normalized = searchTerm.toLowerCase().trim();
        const isActuallySearching = !(!allow_multiple && searchTerm === selectedValue);

        if (!isActuallySearching && !allow_multiple) {
            return children;
        }

        return children.filter(opt =>
            opt.toLowerCase().includes(normalized) &&
            (allow_multiple ? !this.state.selectedItems.includes(opt) : true)
        );
    }
    /**
     * Dodaje wybraną opcję do zaznaczonych elementów.
     * @param {string} item - Wybrana opcja.
     */
    handleSelect = (item: string) => {
        if (this.props.allow_multiple) {
            this.setState(prev => ({
                selectedItems: [...prev.selectedItems, item],
                searchTerm: "",
                isDropdownOpen: false
            }));
        } else {
            this.setState({
                selectedValue: item,
                searchTerm: item,
                isDropdownOpen: false
            });
        }
    };
    /**
 * Dodaje nową opcję wpisaną w polu wyszukiwania, jeśli nie jest pusta.
 * @param {React.MouseEvent | React.KeyboardEvent} [e] - Opcjonalne zdarzenie wywołujące dodanie (np. kliknięcie lub Enter).
 */
    handleAddNew = (e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const term = this.state.searchTerm.trim();
        if (!term) return;

        if (this.props.allow_multiple) {
            this.setState(prev => ({
                selectedItems: [...prev.selectedItems, term],
                searchTerm: "",
                isDropdownOpen: false
            }));
        } else {
            this.setState({
                selectedValue: term,
                searchTerm: term,
                isDropdownOpen: false
            });
        }
    };

    /**
     * Usuwa wybrany element z listy zaznaczonych elementów.
     * @param {string} item - Element do usunięcia.
     */
    handleRemoveChip = (item: string) => {
        this.setState(prev => ({
            selectedItems: prev.selectedItems.filter(i => i !== item)
        }));
    };
    /**
     * Renderuje komponent DynamicSelect wraz z:
     * - inputem wyszukiwania,
     * - listą wybranych elementów (chips),
     * - dropdownem z pasującymi opcjami i możliwością dodania nowej opcji.
     * @returns {JSX.Element} - Renderowany element React.
     */
    render() {
        const { label, id, allow_multiple = true, placeholder } = this.props;
        const { searchTerm, isDropdownOpen, selectedItems, selectedValue } = this.state;

        const filtered = this.getFilteredOptions();
        /**
        * Określa, czy aktualnie wpisana wartość
        * nie istnieje jeszcze na liście opcji
        * i może zostać dodana jako nowa.
        */
        const isNewOption =
            searchTerm.trim() !== "" &&
            !this.props.children?.map(c => c.toLowerCase()).includes(searchTerm.toLowerCase());

        const placeholderOverride = `
        #${id}::placeholder {
            color: #444 !important;
            opacity: 1 !important;
            -webkit-text-fill-color: #444 !important;
        }
    `;

        return (
            <div className="form-group" ref={this.containerRef}>
                <style>{placeholderOverride}</style>

                <label htmlFor={id}>{label}:</label>

                <div className={allow_multiple ? "multi-select-container" : "single-select-container"}>

                    {allow_multiple &&
                        selectedItems.map(item => (
                            <Chip
                                key={item}
                                label={item}
                                onRemove={() => this.handleRemoveChip(item)}
                            />
                        ))}


                    <div className="input-wrapper" style={{ position: "relative", flex: 1 }}>

                        <input
                            type="text"
                            id={id}
                            autoComplete="off"
                            className={allow_multiple ? "multi-input" : "single-input"}
                            placeholder={placeholder || (allow_multiple ? "Wybierz opcje..." : "Wybierz...")}
                            value={searchTerm}
                            onClick={() => this.setState({ isDropdownOpen: true })}
                            onChange={(e) =>
                                this.setState({
                                    searchTerm: e.target.value,
                                    isDropdownOpen: true
                                })
                            }
                            style={arrowStyle}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (isNewOption) this.handleAddNew(e);
                                    else if (filtered.length > 0) this.handleSelect(filtered[0]);
                                }
                            }}

                        />

                        {isDropdownOpen && (filtered.length > 0 || isNewOption) && (
                            <div className="dropdown-results" style={dropdownStyle}>
                                {isNewOption && (
                                    <div
                                        className="dropdown-item"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            this.handleAddNew(e);
                                        }}
                                        style={{ padding: "8px", fontWeight: "bold", cursor: "pointer" }}
                                    >
                                        Dodaj: "{searchTerm}"
                                    </div>
                                )}

                                {filtered.map(option => (
                                    <div
                                        key={option}
                                        className="dropdown-item"
                                        onClick={() => this.handleSelect(option)}
                                        style={{
                                            padding: "8px",
                                            cursor: "pointer",
                                            backgroundColor:
                                                !allow_multiple && option === selectedValue
                                                    ? "#F0F8FF"
                                                    : "transparent"
                                        }}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {allow_multiple && (
                        <Chip label="Dodaj" onRemove={this.handleAddNew} isAddButton />
                    )}
                </div>
            </div>
        );
    }

}
/**
 * Style CSS dla listy rozwijanej z wynikami wyszukiwania.
 * Odpowiadają za pozycjonowanie dropdownu pod inputem.
 */
const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 10,
    top: "100%",
    width: "100%",
    backgroundColor: "white",
    border: "1px solid #ccc",
    borderRadius: "0.5em",
    marginTop: "4px",
    maxHeight: "200px",
    overflowY: "auto"

};
