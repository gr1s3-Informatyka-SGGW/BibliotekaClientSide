/**
 * @file SearchPanel.tsx
 * @description Implementuje główny panel wyszukiwania, który agreguje dane z pola tekstowego
 * oraz dynamicznie przekazywanych komponentów filtrujących.
 * @author Karol Dziuba
 */

import React, { Component } from 'react';
import type { ReactNode} from 'react';
import type IFormComponent from '../custom_components/IFormComponent.tsx'
import type { IFilter, SearchSort } from "../server/server_types.ts";
import ScanButton from "../elements_user/ScanButton.tsx";
import './SearchPanel.css';

import searchIcon from '/assets/search.svg'

/**
 * Reprezentuje strukturę danych zwracaną przez komponent `SearchPanel`.
 * Obiekt ten agreguje stan paska wyszukiwania (tekst) oraz dynamicznie
 * zebrane dane z komponentów podrzędnych (filtry i sortowanie).
 *
 * @interface SearchPanelReturn
 * @property {string} search - Aktualna fraza wpisana przez użytkownika w polu tekstowym.
 * @property {SearchSort} [sorting] - Obiekt określający klucz i kierunek sortowania (jeśli zdefiniowano komponent sortujący).
 * @property {IFilter} [filter] - Obiekt zawierający aktywne filtry, gdzie kluczem jest nazwa pola (np. 'status'), a wartością tablica wybranych opcji.
 */
export interface SearchPanelReturn {
    search: string;
    sorting?: SearchSort;
    filter?: IFilter;
}

/**
 * Właściwości (props) przyjmowane przez komponent SearchPanel.
 *
 * @property [children] - Komponenty podrzędne (filtry), które muszą implementować interfejs IFormComponent.
 * @property {string} [placeholder] - Atrybut placeholder dla inputu wyszukiwania
 * @property {(value: string) => void} [scanButtonFunction] - Funkcja wywołana przy naciśnięciu guzika skanowania, jeśli nie obecny guzik nie zostanie stworzony
 * @property [onSearch] - Funkcja zwrotna (callback) wywoływana po zatwierdzeniu wyszukiwania (Enter lub przycisk).
 * @property [defaultValue] - Wartość paska wyszukiwania przy załadowaniu strony
 */
interface SearchPanelProps {
    children?: ReactNode;
    placeholder?: string;
    scanButtonFunction?: (value: string) => void
    onSearch?: (data: SearchPanelReturn) => void;
    defaultValue?: string
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
 * Implementuje interfejs IFormComponent, zwracając typ SearchPanelReturn.
 * @prop {SearchPanelProps} props
 * @prop {SearchPanelState} state
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
     * @param props Właściwości przekazane do komponentu.
     */
    constructor(props: SearchPanelProps) {
        super(props);
        this.state = {
            searchValue: props.defaultValue ?? ''
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
            filter: {} as IFilter
        };


        this.childComponents.forEach(child => {
            if (child && typeof child.getValue === 'function') {
                const childData = child.getValue();

                if (childData.sorting) {
                    result.sorting = childData.sorting;
                }

                if (childData.filter) {
                        Object.assign(result.filter!, childData.filter);
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
     * @param e Zdarzenie zmiany inputa.
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
         * Wykorzystuje `React.Children.map` oraz `React.cloneElement`, aby "wstrzyknąć" funkcję `ref`
         * do każdego poprawnego elementu Reacta. Callback ten rejestruje instancję komponentu
         * w tablicy `this.childComponents`.
         * Jest to kluczowe, aby rodzic (SearchPanel) mógł wywołać metodę `getValue()` na dzieciach
         * i zebrać dane o filtrach.
         */

        const childrenWithRefs = React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
                return React.cloneElement(child as any, {
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

                    <div style={{ width: '100%', display: 'flex', gap: '0.25em'}}>
                        <input
                            type="text"
                            placeholder={this.props.placeholder ?? "Szukaj książki po tytule, autorze lub ISBN..."}
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
                                src={searchIcon}
                                alt=""
                                style={{ filter: 'brightness(0) invert(1)' }}
                            />
                        </button>
                        {this.props.scanButtonFunction ?
                            <ScanButton onScan={this.props.scanButtonFunction} enabledTooltipMessage="Wypożycz skanując kod QR"/>
                         : <></>
                        }
                    </div>
                </div>

                <div className = "search-advanced">
                    {childrenWithRefs}
                </div>
            </div>
        );
    }
}