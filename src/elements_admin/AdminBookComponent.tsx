/**
 * @file  Implementuje blok pojedyńczej książki na stronie /catalog administratora. Obsługuje akcje kliknięcia guzików
 * @author Aleksander Grzegrzułka
 * */
import React, { type JSX } from "react";
import type { BookAdmin } from "../../public/server_types.ts";
import {addBookInstanceRequest, removeBookRequest, markDamagedBookInstanceRequest, removeBookInstanceRequest, markMendedBookInstanceRequest } from "../../public/server_requests.ts";
import { CustomSelect, CustomOption } from "../../public/custom_components/CustomSelect.tsx";
import InstanceQR from "./InstanceQR.tsx";
import bookIcon from '../assets/book.svg'
import scannerIcon from '../assets/qr_code_scanner.svg'
import Collapsible from '../../public/custom_components/Collapsible.tsx'
import {AddBookForm} from "./AddBookView.tsx";
import Popup from "../../public/custom_components/Popup.tsx";
import '../general_elements/catalog.css'

/**
 * Komponent klasowy wyświetlający szczegółowe informacje o książce w widoku administratora.
 * Zawiera nagłówek z tytułem i akcjami oraz zwijaną sekcję ze szczegółami.
 * @extends React.Component
 *
 * @prop props
 * @prop {BookAdmin} props.book_info - Obiekt zawierający szczegółowe informacje o książce.
 * */

export default class AdminBookComponent extends React.Component<{ book_info: BookAdmin }, {}> {
    render(): JSX.Element {
        const b = this.props.book_info;
        const authors = b.authors.join(", ");
        const genres = b.genre.join(", ");

        return <div className="book">
            <div className="header-actions">
                <h3 className="header">
                    <img src={bookIcon} alt="icon" /> „{b.title}” — {authors}
                </h3>
                <div className="flex-row librarian-actions">
                    <button>
                        <CustomSelect label="Pokaż działania">
                            <CustomOption value="add" onClick={this.addInstance}>Dodaj egzemplarz</CustomOption>
                            <CustomOption value="edit" onClick={this.editBook}>Edytuj dane książki</CustomOption>
                            <CustomOption value="delete" onClick={this.removeBook}>Usuń książkę z systemu</CustomOption>
                        </CustomSelect>
                    </button>
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
                    <span className="label">Tagi:</span> <div className="tags">{b.keywords.map((keyword, index) => (<div className="tag" key={index}>{keyword}</div>))}</div>
                </div>
            </Collapsible>
            <Collapsible header="Egzemplarze">
                <div className="copies">
                    {b.instances.map((ins, index) =>
                        <InstanceComponent index={index} key={index} id={ins.id} status={ins.status}></InstanceComponent>
                    )}
                </div>
            </Collapsible>
        </div>
    }

    /**
     * @event addInstance Obsługuje zdarzenie kliknięcia opcji 'Dodaj egzemplarz'
     * @returns {void}
     */
    addInstance = (): void => {
        if (this.props.book_info.book_id === undefined) {
            console.error(`book_id is undefined\n${JSON.stringify(this.props.book_info)}`)
            return;
        }
        try {
            addBookInstanceRequest(this.props.book_info.book_id);
        } catch(e) {
            console.error(`${e}`);
        }
    }

    /**
     * @event removeBook Obsługuje zdarzenie kliknięcie opcji 'Usuń książkę z systemu'
     * @returns {void}
     */
    removeBook = (): void => {
        if (this.props.book_info.book_id === undefined) {
            console.error(`book_id is undefined\n${JSON.stringify(this.props.book_info)}`)
            return;
        }
        try {
            removeBookRequest(this.props.book_info.book_id);
        } catch(e) {
            console.error(`${e}`);
        }
    }
    /**
     * @event editBook Obsługuje zdarzenie wybrania opcji 'Edytuj książkę'. Wywołuje komponent <AddBookForm> i wysyła jego wynik do serwera
     * */
    editBook = (): void => {
        const editForm = new AddBookForm();
        return <Popup><>{editForm}</></Popup>
    }
}

interface InstanceComponentProps {
    index: number
    id: number
    status: "damaged" | "available" | "rented" | "reserved"
}

/**
 * Obiekt prezentujący pojedyńczy egzemplarz znajdujący się na liście egzemplarzy książki
 * @extends React.Component
 *
 * @prop props
 * @prop {number} props.id
 * @prop {"damaged"|"available"|"rented"|"reserved"} props.state - status egzemplarza decydujący o jego dostępności i możliwych akcjach
 * */
function InstanceComponent(props: InstanceComponentProps) {

    /**
     * @event markDamaged Obsługuje zdarzenie kliknięcia guzika "Ozn. jako zniszczony". Oznacza egzemplarz jako zniszczony, wysyła żądanie do serwera. Nie dostępny, gdy egzemplarz ma status `damaged`
     * */
    const markDamaged = () => {
        markDamagedBookInstanceRequest(props.id);
    }
    /**
     * @event markMended Obsługuje zdarzenie kliknięcia guzika "Anuluj zniszczenie". Oznacza egzemplarz jako już nie zniszczony, wysyła żądanie do serwera. Dostępny, tylko gdy egzemplarz ma status 'damaged'
     * */
    const markMended = () => {
        markMendedBookInstanceRequest(props.id);
    }
    /**
     * @event remove Obsługuje zdarzenie kliknięcia guzika "Usun". Wysyła żądanie usunięcia — usuwa egzemplarz.
     * */
    const remove = () => {
        removeBookInstanceRequest(props.id);
    }
    /**
     * @event displayQRCode Obsługuje zdarzenie kliknięcia guzika z symbolem kodu QR. wyświetla komunikat z kodem QR egzemplarza
     * */
    const displayQRCode = () => {
        return <InstanceQR instance_id={props.id} />
    }

    const status = props.status;
    const buttonMarkDamagedVisible = status !== "damaged";
    const buttonMarkMendedVisible = status === "damaged";

    const statusClass = "status-" + status;
    const statusText = (() => {
        if (status === "damaged") {
            return "Zniszczony"
        } else if (status === "available") {
            return "Dostępny"
        } else if (status === "rented") {
            return "Wypożyczony"
        } else if (status === "reserved") {
            return "Zarezerwowany"
        }
    })();

    return <>
        <div className="copy">
            <span><b>Egzemplarz #{props.index + 1}</b> - <span className={statusClass}>{statusText}</span></span>
            <div className="actions">
                <button onClick={displayQRCode}><img src={scannerIcon} /></button>
                <button onClick={remove} className="borrow button" >Usuń</button>
                {buttonMarkDamagedVisible && <button onClick={markDamaged} className="reserve button w-46" >Ozn. jako zniszczony</button>}
                {buttonMarkMendedVisible && <button onClick={markMended} className="reserve button w-46" >Anuluj zniszczenie</button>}
            </div>
        </div>
    </>;
}