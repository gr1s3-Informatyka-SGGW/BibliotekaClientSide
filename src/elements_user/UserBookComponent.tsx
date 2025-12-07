import { Component, type JSX } from "react";
import Collapsible from '../../public/custom_components/Collapsible.tsx'
import bookIcon from '../assets/book.svg'
import {type Book} from "../../public/db_types.ts"

/**
 * Właściwości (props) dla komponentu UserBookComponent.
 * @property {Book} book_info - Obiekt zawierający szczegółowe informacje o książce.
 */
type Props = { book_info: Book };

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

        const disableRentButton = (b.instances.available === 0) ? true : false;
        const disableReserveButton = (b.instances.total === 0) ? true : false;

        return <div className="book">
            <div className="header-actions">
                <h3 className="header">
                    <img src={bookIcon} alt="icon" /> „{b.title}” — {authors}
                </h3>
                <div className="flex-row reader-actions">
                    <button onClick={this.onRentBookPressed} disabled={disableRentButton}>Wypożycz</button>
                    <button onClick={this.onReserveBookPressed} disabled={disableReserveButton}>Zarezerwuj</button>
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

    /**
     * Obsługuje zdarzenie kliknięcia przycisku "Wypożycz".
     * @returns {void}
     */
    onRentBookPressed = (): void => {
        alert(`naciśnięto wypożycz dla „${this.props.book_info.title}”`)
    }

    /**
     * Obsługuje zdarzenie kliknięcia przycisku "Zarezerwuj".
     * @returns {void}
     */
    onReserveBookPressed = (): void => {
        alert(`naciśnięto zarezerwuj dla „${this.props.book_info.title}”`)
    }

}

export default UserBookComponent;