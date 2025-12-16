/**
 * @file Implementuje główny panel wyszukiwania z obsługą filtrów i sortowania
 * @author Karol Dziuba
 */

import React, { Component } from 'react';
import type { ReactNode } from 'react';
import type IFormComponent from '../../public/custom_components/IFormComponent.tsx'

/**
 * Typ zwracany przez funkcję wyszukiwania zawierający frazę, sortowanie i filtry
 * @property search - Wpisana fraza wyszukiwania
 * @property sorting - Obiekt określający pole i kierunek sortowania
 * @property filter - Tablica aktywnych filtrów
 */
interface SearchPanelReturn {
    search: string;
    sorting?: {
        by: string;
        order: 'ASC' | 'DSC';
    };
    filter?: {
        key: string;
        values: string[];
    }[];
}

/**
 * Typy właściwości przyjmowane przez komponent SearchPanel
 * @property children - Komponenty filtrów
 * @property onSearch - Funkcja wywoływana po zatwierdzeniu wyszukiwania
 */
interface SearchPanelProps {
    children?: ReactNode;
    onSearch?: (data: SearchPanelReturn) => void;
}

interface SearchPanelState {
    searchValue: string;
}

/**
 * Główny komponent klasy implementujący pasek wyszukiwania.
 * Zarządza stanem paska wyszukiwania i renderuje kontenery dla dodatkowych filtrów.
 */
export default class SearchPanel extends Component<SearchPanelProps, SearchPanelState> implements IFormComponent<SearchPanelReturn> {

    constructor(props: SearchPanelProps) {
        super(props);
        this.state = {
            searchValue: ''
        };
    }

    /**
     * Zwraca aktualny stan formularza wyszukiwania
     * @returns {SearchPanelReturn} Obiekt z danymi wyszukiwania
     */
    getValue(): SearchPanelReturn {
        return {
            search: this.state.searchValue
        };
    }

    private handleSearchClick = () => {
        if (this.props.onSearch) {
            this.props.onSearch(this.getValue());
        }
    };

    private handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            this.handleSearchClick();
        }
    };

    private handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ searchValue: e.target.value });
    };

    render() {
        const { children } = this.props;
        const { searchValue } = this.state;

        return (
            <div className="flex-column search" style={{ marginBottom: '0.5em' }}>
                <div>
                    <h4 style={{ margin: 0, marginBottom: '0.4em' }}>Szukaj</h4>

                    <div style={{ width: '100%', display: 'flex', gap: '0.25em', overflow: 'hidden' }}>
                        <input
                            type="text"
                            className="search-bar"
                            placeholder="Szukaj książki po tytule, autorze lub ISBN..."
                            value={searchValue}
                            onChange={this.handleInputChange}
                            onKeyDown={this.handleKeyDown}
                        />
                        <button
                            onClick={this.handleSearchClick}
                            type="button"
                        >
                            <img
                                src="src/assets/search.svg"
                                alt="Szukaj"
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                        </button>
                        {/* Opcjonalny drugi przycisk QR */}
                    </div>
                </div>

                <div>
                    <div>
                        {/* Kontener filtrów */}
                        <div className="search-advanced">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}