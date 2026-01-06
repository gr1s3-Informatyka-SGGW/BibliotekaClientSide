/**
 * @file Implementuje okno modalne wyświetlające szczegóły książki (BookDetailsPopup).
 * Komponent prezentuje dane bibliograficzne oraz umożliwia szybkie przejście do katalogu
 * poprzez kliknięcie kluczowych pól (autor, wydawnictwo, gatunek, tagi).
 *
 * Funkcjonalności:
 * - Wyświetlanie sformatowanych szczegółów książki (Tytuł, Autorzy, ISBN, etc.).
 * - Interaktywne linki dla pól: Autorzy, Wydawnictwo, Gatunki, Język, Tagi.
 * - Wyświetlanie dymka (Tooltip) po najechaniu na interaktywne elementy.
 *
 * @author Aleksander Grzegrzułka
 */

import React, { type JSX } from "react";
import type { Book } from "../../public/server_types.ts";
import Popup from "../../public/custom_components/Popup.tsx";
import CustomTooltip from "../../public/custom_components/CustomTooltip.tsx";

/**
 * Interfejs definiujący właściwości komponentu BookDetailsPopup.
 * @interface BookDetailsPopupProps
 * @property {boolean} isOpen - wartość hook'a obsługującego zamykanie i otwieranie okna
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setIsOpen - setter isOpen
 * @property {()=>void} [onClose] - event wywołany przy zamknięciu okna poprzez kliknięcie escape lub poza komponent
 * @property {Book} [book] - Obiekt zawierający dane książki do wyświetlenia w szczegółach.
 */
export interface BookDetailsPopupProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClose?: () => void;
  book?: Book;
}

/**
 * Komponent wyświetlający szczegóły książki w oknie modalnym.
 * @component
 * @param {BookDetailsPopupProps} props - Właściwości komponentu.
 * @returns {JSX.Element} Wyrenderowane okno popup.
 */
export default function BookDetailsPopup(props: BookDetailsPopupProps): JSX.Element {
  const { isOpen, setIsOpen, onClose, book } = props;

  // Helper do generowania bezpiecznych linków
  const makeCatalogLink = (key: string, value: string) => {
    return `/catalog?${key}=${encodeURIComponent(value)}`;
  }; 

  const formatISBN = (isbn: string) => isbn.replace(/(\d{3})(\d{1})(\d{2})(\d{6})(\d{1})/, "$1-$2-$3-$4-$5");

  return (
    <Popup
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Szczegóły książki"
      onClose={onClose}
    >
      {book && (
        <div className="book-details-content" style={{ fontSize: '0.95em' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            gap: '0.6em 1.2em',
            alignItems: 'baseline'
          }}>

            <strong>Tytuł:</strong>
            <span>{book.title}</span>

            <strong>Autorzy:</strong>
            <span>
              {book.authors.map((author, index) => (
                <span key={index}>
                  {index > 0 && ", "}
                  <CustomTooltip title="Szukaj autora w katalogu">
                    <a href={makeCatalogLink('author', author)}>
                      {author}
                    </a>
                  </CustomTooltip>
                </span>
              ))}
            </span>

            <strong>Wydawnictwo:</strong>
            <span>
              <CustomTooltip title="Szukaj wydawnictwa w katalogu">
                <a href={makeCatalogLink('publisher', book.publisher)}>
                  {book.publisher}
                </a>
              </CustomTooltip>
              {" "}({book.publish_year})
            </span>

            <strong>ISBN:</strong>
            <span>{formatISBN(book.isbn_number)}</span>

            <strong>Gatunki:</strong>
            <span>
              {book.genre.map((genre, index) => (
                <span key={index}>
                  {index > 0 && ", "}
                  <CustomTooltip title="Szukaj gatunku w katalogu">
                    <a href={makeCatalogLink('genre', genre)}>
                      {genre}
                    </a>
                  </CustomTooltip>
                </span>
              ))}
            </span>

            <strong>Język:</strong>
            <span>
              <CustomTooltip title="Szukaj języka w katalogu">
                <a href={makeCatalogLink('language', book.language)}>
                  {book.language}
                </a>
              </CustomTooltip>
            </span>

            <strong>Liczba stron:</strong>
            <span>{book.length} stron</span>
            <strong>Tagi:</strong>
            <div className="tags">
              {book.keywords.map((keyword, index) => (
                <CustomTooltip key={index} title={`Szukaj tagu „${keyword}”`}>
                  <a href={makeCatalogLink('tags', keyword)} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="tag hover:bg-[#e0bfc8] hover:text-[#8b234d] cursor-pointer transition-colors">
                      {keyword}
                    </div>
                  </a>
                </CustomTooltip>
              ))}
            </div>

          </div>
        </div>
      )}
      <div className="flex flex-row *:flex-1 mt-6">
        <button onClick={onClose} className="boring">Zamknij</button>
      </div>
    </Popup>
  );
}