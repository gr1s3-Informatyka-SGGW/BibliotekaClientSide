import React, { Component, createRef } from "react";
import type IFormComponent from "./IFormComponent.tsx";

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

    if (isAddButton) {
        return (
            <div className={className} onClick={onRemove}>
                {label}
            </div>
        );
    }

    return (
        <div className={className}>
            {label}
            <span className="chip-close" onClick={onRemove}>x</span>
        </div>
    );
};


interface DynamicSelectProps {
    label: string;
    id: string;
    children?: string[];
    allow_multiple?: boolean;
    placeholder?: string;
    default_value?: string|string[]
}

interface DynamicSelectState {
    searchTerm: string;
    isDropdownOpen: boolean;
    selectedItems: string[];
    selectedValue: string;
}

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

    private containerRef = createRef<HTMLDivElement>();

    constructor(props: DynamicSelectProps) {
        super(props);
        this.state = {
            searchTerm: "",
            isDropdownOpen: false,
            selectedItems: [],
            selectedValue: ""
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
 * Usuwa globalny nasłuch zdarzeń kliknięcia myszą przy odmontowaniu komponentu.
 */
    componentWillUnmount() {
        document.removeEventListener("mousedown", this.handleClickOutside);
    }
    /**
     * Obsługuje kliknięcia poza komponentem.
     * Jeśli kliknięto poza dropdownem, zamyka listę i resetuje pole wyszukiwania.
     * @param {MouseEvent} event - Zdarzenie kliknięcia myszą.
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
        const { children = [] } = this.props;
        const { searchTerm, selectedItems } = this.state;
        const normalized = searchTerm.toLowerCase().trim();

        return children.filter(opt =>
            opt.toLowerCase().includes(normalized) &&
            (this.props.allow_multiple ? !selectedItems.includes(opt) : true)
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
     */
    handleAddNew = () => {
        const term = this.state.searchTerm.trim();
        if (!term) return;
        this.handleSelect(term);
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
        const { label, id, allow_multiple = true, children = [], placeholder } = this.props;
        const { searchTerm, isDropdownOpen, selectedItems, selectedValue } = this.state;

        const filtered = this.getFilteredOptions();
        const isNewOption =
            searchTerm.trim() !== "" &&
            !children.map(c => c.toLowerCase()).includes(searchTerm.toLowerCase());

        return (
            <div className="form-group" ref={this.containerRef} style={{ position: "relative" }}>
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

                    <input
                        type="text"
                        id={id}
                        autoComplete="off"
                        className={allow_multiple ? "multi-input" : "single-input"}
                        placeholder={placeholder || (allow_multiple ? "Wybierz opcje..." : "Wybierz...")}
                        value={searchTerm}
                        onClick={() => this.setState({ isDropdownOpen: true })}
                        onChange={(e) =>
                            this.setState({ searchTerm: e.target.value, isDropdownOpen: true })
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                if (isNewOption) this.handleAddNew();
                                else if (filtered.length > 0) this.handleSelect(filtered[0]);
                            }
                        }}
                    />

                    {allow_multiple && (
                        <Chip label="Dodaj" onRemove={this.handleAddNew} isAddButton />
                    )}
                </div>

                {isDropdownOpen && (filtered.length > 0 || isNewOption) && (
                    <div className="dropdown-results" style={dropdownStyle}>
                        {isNewOption && (
                            <div
                                className="dropdown-item"
                                onClick={this.handleAddNew}
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
        );
    }
}

const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    zIndex: 10,
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    border: "1px solid #ccc",
    borderRadius: "0.5em",
    marginTop: "4px",
    maxHeight: "200px",
    overflowY: "auto"
};
