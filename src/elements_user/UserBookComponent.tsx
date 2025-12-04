/*
* odpowiadający plik w design: 'navbar.js'
* widok w design: https://kocham-sggw.ct.ws/biblioteka/Client/catalog.html widoczny na liście książek
* realizowana funkcjonalność:
*   wyświetlał informacje o książce na podstawie dany, podanych jako atrybut book_info,
* używane komponenty:
*   <Collapsable> // dopóki nie jest gotowy ma się nie zwijać
 */
import { Component } from "react";
import Collapsible from '../../public/custom_components/Collapsible.tsx'
import bookIcon from '../assets/book.svg'
import {type Book} from "../../public/db_types.ts"

type Props = { book_info: Book };
type State = {};

class UserBookComponent extends Component<Props, State> {
    render() {
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

        return <div className="book">
            <div className="header-actions">
                <h3 className="header">
                    <img src={bookIcon} alt="icon" /> „{b.title}” — {authors}
                </h3>
                <div className="flex-row reader-actions">
                    <button onClick={this.onRentBookPressed}>Wypożycz</button>
                    <button onClick={this.onReserveBookPressed}>Zarezerwuj</button>
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
                    <span className="label">Tagi:</span> <span><div className="tags">{b.keywords.map((keyword) => (<div className="tag">{keyword}</div>))}</div></span>
                </div>
            </Collapsible>
        </div>
    }

    onRentBookPressed = () => {
        alert(`naciśnięto wypożycz dla „${this.props.book_info.title}”`)
        console.log("DAD");
    }

    onReserveBookPressed = () => {
        alert(`naciśnięto zarezerwuj dla „${this.props.book_info.title}”`)
    }

}

export default UserBookComponent;