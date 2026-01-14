/**
 * @file Implementuje komponent paginacji używany do nawigacji między stronami wyników w katalogu.
 * Funkcjonalności komponentu:
 * - Blokowanie przycisków nawigacji na pierwszej i ostatniej stronie.
 * - Wyświetlanie aktualnego numeru strony oraz całkowitej liczby stron.
 * - Obsługa płynnego przejścia między podstronami za pomocą callbacku.
 * @author Aleksander Grzegrzułka
 */

import { type JSX } from 'react';
import iconNext from "../../src/assets/arrow_forward.svg"
import iconPrev from "../../src/assets/arrow_back.svg"

/**
 * @type PaginationProps - właściwości komponentu paginacji
 * @prop {number} currentPage - aktualnie wyświetlana strona wyników
 * @prop {number} totalPages - łączna liczba stron dostępnych do wyświetlenia
 * @prop {(page: number) => void} onPageChange - funkcja wywoływana przy zmianie strony, przyjmuje nowy numer strony jako argument
 */
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

/**
 * Komponent funkcyjny Pagination.
 * Renderuje pasek nawigacji stronami.
 * @param {PaginationProps} props — parametry wejściowe komponentu
 * @returns {JSX.Element} Wyrenderowany interfejs nawigacji
 */
export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps): JSX.Element => {
    const isFirst = currentPage <= 1;
    const isLast = currentPage >= totalPages;

    return (
        <div className="flex items-center justify-center gap-4 my-4">
            <button
                onClick={() => { onPageChange(currentPage - 1) }}
                disabled={isFirst}
                className="flex items-center border boring"
            >
                <img src={iconPrev} alt="" className="invert-0" />
                Poprz.
            </button>

            <span className="bg-rose-100 text-rose-900 font-bold px-4 py-2 rounded-lg text-center whitespace-nowrap">
                <span className="hidden sm:inline">Strona </span>
                {currentPage} z {totalPages}
            </span>

            <button
                onClick={() => { onPageChange(currentPage + 1) }}
                disabled={isLast}
                className="flex items-center border boring"
            >
                Nast.
                <img src={iconNext} alt="" className="invert-0" />
            </button>
        </div>
    );
};