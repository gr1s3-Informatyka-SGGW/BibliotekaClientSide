/**
 * @file Implementuje główny panel wyszukiwania, który agreguje dane z pola tekstowego
 * oraz dynamicznie przekazywanych komponentów filtrujących.
 * @author Karol Dziuba
 */

import React, { Component } from 'react';
import type { ReactNode } from 'react';
import type IFormComponent from '../../public/custom_components/IFormComponent.tsx'
import '../style.css';
import '../input.css';
import type {IFilter, SearchSort} from "../../public/server_types.ts";

/**
 * @type SearchPanelReturn Typ zwracany przez funkcję wyszukiwania.
 * Zawiera zagregowane dane z paska wyszukiwania oraz wszystkich aktywnych filtrów.
 *
 * @property search - Wpisana fraza wyszukiwania.
 * @property {SearchSort} [sorting] - Obiekt określający pole i kierunek sortowania.
 * @property {IFilter} [filter] - Tablica obiektów reprezentujących aktywne filtry.
 */
export interface SearchPanelReturn {
    search: string;
    sorting?: SearchSort
    filter?: IFilter;
}

/**
 * Właściwości (props) przyjmowane przez komponent SearchPanel.
 *
 * @property {Component & IFormComponent<any>} children - Komponenty podrzędne (filtry), które muszą implementować interfejs IFormComponent.
 * @property onSearch - Funkcja zwrotna (callback) wywoływana po zatwierdzeniu wyszukiwania (Enter lub przycisk).
 */
interface SearchPanelProps {
    children?: Component & IFormComponent<any>;
    onSearch?: (data: SearchPanelReturn) => void;
}

/**
 * Stan wewnętrzny komponentu SearchPanel.
 *
 * @property searchValue - Aktualna wartość wpisana w pole tekstowe wyszukiwania.
 */
interface SearchPanelState {
    searchValue: string;
}

/**
 * Główny komponent klasy implementujący pasek wyszukiwania.
 * Zarządza stanem inputa oraz iteruje po komponentach podrzędnych (filtrach),
 * aby zebrać kompletny zestaw danych do zapytania.
 *
 * @implements IFormComponent<SearchPanelReturn>
 * @extends Component
 * @prop {SearchPanelProps} Props
 */
export default class SearchPanel extends Component<SearchPanelProps, SearchPanelState> implements IFormComponent<SearchPanelReturn> {

    /**
     * Tablica przechowująca referencje do instancji komponentów podrzędnych (filtrów).
     * Umożliwia wywołanie metody getValue() na każdym z dzieci.
     * @private
     */
    private childComponents: IFormComponent<Partial<SearchPanelReturn>>[] = [];

    /**
     * Inicjalizuje komponent z domyślnym pustym stanem wyszukiwania.
     * @param {SearchPanelProps} props Właściwości przekazane do komponentu.
     */
    constructor(props: SearchPanelProps) {
        super(props);
        this.state = {
            searchValue: ''
        };
    }

    /**
     * Główna metoda interfejsu IFormComponent.
     * Agreguje dane z lokalnego stanu (input) oraz wszystkich zarejestrowanych
     * komponentów podrzędnych (sortowanie, filtry).
     *
     * @returns {SearchPanelReturn} Obiekt zawierający frazę wyszukiwania oraz zebrane filtry/sortowanie.
     */
    getValue(): SearchPanelReturn {
        const result: SearchPanelReturn = {
            search: this.state.searchValue,
            filter: []
        };

        this.childComponents.forEach(child => {
            if (child && typeof child.getValue === 'function') {
                const childData = child.getValue();

                if (childData.sorting) {
                    result.sorting = childData.sorting;
                }

                if (childData.filter && Array.isArray(childData.filter)) {
                    if (!result.filter) result.filter = [];
                    result.filter.push(...childData.filter);
                }
            }
        });

        return result;
    }

    /**
     * Obsługuje kliknięcie, w przycisk lupy (szukaj).
     * Wywołuje prop onSearch z aktualnymi danymi.
     * @private
     */
    private handleSearchClick = () => {
        if (this.props.onSearch) {
            this.props.onSearch(this.getValue());
        }
    };

    /**
     * Obsługuje naciśnięcie klawisza w polu input.
     * Jeśli wciśnięto 'Enter', wyzwala wyszukiwanie.
     * @param e Zdarzenie klawiatury.
     * @private
     */
    private handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            this.handleSearchClick();
        }
    };

    /**
     * Aktualizuje stan lokalny komponentu po wpisaniu tekstu.
     * @param {React.ChangeEvent<HTMLInputElement>} e Zdarzenie zmiany inputa.
     * @private
     */
    private handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ searchValue: e.target.value });
    };

    /**
     * Renderuje strukturę DOM komponentu.
     * Przetwarza (klonuje) dzieci, aby wstrzyknąć im funkcję ref,
     * co pozwala na dostęp do ich metod (getValue).
     *
     * @returns {ReactNode} Wyrenderowany element JSX.
     */
    render(): ReactNode {
        const { children } = this.props;
        const { searchValue } = this.state;

        this.childComponents = [];

        /**
         * Przetwarza przekazane komponenty podrzędne (dzieci), dodając do nich mechanizm referencji.
         * * Wykorzystuje `React.Children.map` oraz `React.cloneElement`, aby "wstrzyknąć" funkcję `ref`
         * do każdego poprawnego elementu React. Callback ten rejestruje instancję komponentu
         * w tablicy `this.childComponents`.
         * * Jest to kluczowe, aby rodzic (SearchPanel) mógł wywołać metodę `getValue()` na dzieciach
         * i zebrać dane o filtrach.
         */

        const childrenWithRefs = React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                    ref: (node: IFormComponent<Partial<SearchPanelReturn>>) => {
                        if (node) {
                            this.childComponents.push(node);
                        }
                    }
                });
            }
            return child;
        });

        return (
            <div className="flex-column search" style={{ marginBottom: '0.5em' }}>
                <div>
                    <h4 style={{ margin: 0, marginBottom: '0.4em' }}>Szukaj</h4>

                    <div style={{ width: '100%', display: 'flex', gap: '0.25em', overflow: 'hidden' }}>
                        <input
                            type="text"
                            placeholder="Szukaj książki po tytule, autorze lub ISBN..."
                            value={searchValue}
                            onChange={this.handleInputChange}
                            onKeyDown={this.handleKeyDown}
                        />
                        <button
                            onClick={this.handleSearchClick}
                            type="button"
                            aria-label="Szukaj"
                        >
                            <img
                                src="src/assets/search.svg"
                                alt=""
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                        </button>
                    </div>
                </div>

                {/* Renderowanie przetworzonych dzieci (filtrów) */}
                {childrenWithRefs}
            </div>
        );
    }
}