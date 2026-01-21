/**
 * @file Implementuje blok pojedyńczej książki na stronie /catalog użytkownika. Obsługuje akcje kliknięcia guzików
 * @author Aleksander Grzegrzułka
 * */
import { Component, type JSX } from "react";
import Collapsible from '../custom_components/Collapsible.tsx'
import bookIcon from '/assets/book.svg'
import { type BookUser } from "../server/server_types.ts"
import { rentBookRequest, reserveBookRequest } from "../server/server_requests.ts";

/**
 * Właściwości (props) dla komponentu UserBookComponent.
 * * @property {BookUser} book_info - Obiekt zawierający szczegółowe informacje o książce widoczne dla użytkownika.
 * @property {function} [onRentBookPressed] - Opcjonalna funkcja wywoływana przy próbie wypożyczenia książki.
 * @property {function} [onReserveBookPressed] - Opcjonalna funkcja wywoływana przy próbie rezerwacji książki.
 */
type Props = { 
    book_info: BookUser,
    onRentBookPressed?: (book_info: BookUser) => any,
    onReserveBookPressed?: (book_info: BookUser) => any,
};

/**
 * Stan komponentu UserBookComponent (obecnie pusty).
 */
type State = object;

/**
 * Komponent klasowy wyświetlający szczegółowe informacje o książce w widoku użytkownika.
 * Zawiera nagłówek z tytułem i akcjami oraz zwijaną sekcję ze szczegółami.
 *
 * @extends {Component<Props, State>}
 */
class UserBookComponent extends Component<Props, State> {
    /**
     * Renderuje strukturę HTML komponentu książki.
     * @returns {JSX.Element} Element JSX reprezentujący widok książki.
     */
    render(): JSX.Element {
        const b = this.props.book_info;
        const rent = this.props.onRentBookPressed;
        const reserve = this.props.onReserveBookPressed;
        const authors = b.authors.join(", ");
        const genres = b.genre.join(", ");
        const instances = (() => {
            let ins = b.instances.available + " / " + b.instances.total + " dostępn";
            if (b.instances.total == 0) { ins += "ych"; }
            else if (b.instances.total == 1) { ins += "y"; }
            else if (b.instances.total <= 4) { ins += "e"; }
            else if (b.instances.total > 4) { ins += "ych"; }
            return ins;
        })();

        const disableRentButton = (b.instances.available === 0);
        const disableReserveButton = (b.instances.available === 0);

        return <div className="book">
            <div className="header-actions">
                <h3 className="header">
                    <img src={bookIcon} alt=""/> „{b.title}” — {authors}
                </h3>
                <div className="flex-row reader-actions">
                    <button onClick={() => {rent && rent(b)}} disabled={disableRentButton}>Wypożycz</button>
                    <button onClick={() => {reserve && reserve(b)}} disabled={disableReserveButton}>Zarezerwuj</button>
                </div>
            </div>

            <Collapsible header="Szczegóły">
                <div className="details" style={{ display: 'grid', gridTemplateColumns: '8em 1fr', gap: '0.25em 0.5em' }}>
                    <span className="label">Tytuł:</span> <span>{b.title}</span>
                    <span className="label">Autor:</span> <span>{authors}</span>
                    <span className="label">Rok wydania:</span> <span>{b.publish_year}</span>
                    <span className="label">Wydawnictwo:</span> <span>{b.publisher}</span>
                    <span className="label">ISBN:</span> <span>{b.isbn_number}</span>
                    <span className="label">Gatunek:</span> <span>{genres}</span>
                    <span className="label">Język:</span> <span>{b.language}</span>
                    <span className="label">Liczba stron:</span> <span>{b.length}</span>
                    <span className="label">Dostępne egzemplarze:</span> <span>{instances}</span>
                    <span className="label">Tagi:</span> <div className="tags">{b.keywords.map((keyword, index) => (<div className="tag" key={index}>{keyword}</div>))}</div>
                </div>
            </Collapsible>
        </div>
    }
}

export default UserBookComponent;