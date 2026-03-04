/**
 * @file  Implementuje blok pojedyńczej książki na stronie /catalog administratora. Obsługuje akcje kliknięcia guzików
 * @author Aleksander Grzegrzułka
 * */
import React, { type JSX } from "react";
import type { BookAdmin } from "../server/server_types.ts";
import { CustomSelect, CustomOption } from "../custom_components/CustomSelect.tsx";
import bookIcon from '/assets/book.svg'
import scannerIcon from '/assets/qr_code_scanner.svg'
import Collapsible from '../custom_components/Collapsible.tsx'

/**
 * Właściwości (props) dla komponentu AdminBookComponent.
 * * @property {BookAdmin} book_info - Obiekt zawierający rozszerzone informacje o książce przeznaczone dla panelu administratora.
 * @property {function} [onAddInstancePressed] - Opcjonalna funkcja wywoływana w celu dodania nowego egzemplarza książki.
 * @property {function} [onEditBookPressed] - Opcjonalna funkcja wywoływana w celu edycji danych istniejącej książki.
 * @property {function} [onRemoveBookPressed] - Opcjonalna funkcja wywoływana w celu usunięcia książki z systemu.
 * @property {function} [onInstanceMarkDamagedPressed] - Opcjonalna funkcja wywoływana przy oznaczaniu egzemplarza jako zniszczony.
 * @property {function} [onInstanceMarkMendedPressed] - Opcjonalna funkcja wywoływana przy anulowaniu zniszczenia egzemplarza.
 * @property {function} [onInstanceRemovePressed] - Opcjonalna funkcja wywoływana przy usuwaniu egzemplarza.
 * @property {function} [onInstanceDisplayQRCodePressed] - Opcjonalna funkcja wywoływana przy próbie pokazania kodu QR egzemplarza.
 */
type Props = {
    book_info: BookAdmin,
    onAddInstancePressed?: (book_info: BookAdmin) => void,
    onEditBookPressed?: (book_info: BookAdmin) => void,
    onRemoveBookPressed?: (book_info: BookAdmin) => void,
    onInstanceMarkDamagedPressed?: (book_info: BookAdmin, instance_id: number) => void,
    onInstanceMarkMendedPressed?: (book_info: BookAdmin, instance_id: number) => void,
    onInstanceRemovePressed?: (book_info: BookAdmin, instance_id: number) => void,
    onInstanceDisplayQRCodePressed?: (book_info: BookAdmin, instance_id: number) => void,
};

type State = object;


/**
 * Komponent klasowy wyświetlający szczegółowe informacje o książce w widoku administratora.
 * Zawiera nagłówek z tytułem i akcjami oraz zwijaną sekcję ze szczegółami.
 * @extends React.Component
 *
 * @prop props
 * @prop {BookAdmin} props.book_info - Obiekt zawierający szczegółowe informacje o książce.
 * */

export default class AdminBookComponent extends React.Component<Props, State> {
    render(): JSX.Element {
        const b = this.props.book_info;
        const authors = b.authors && b.authors.length != 0 ? b.authors.join(", ") : "brak";
        const genres = b.genre && b.genre.length != 0 ? b.genre?.join(", ") : "brak";

        const addInstance = this.props.onAddInstancePressed ?? ((b: BookAdmin) => { });
        const editBook = this.props.onEditBookPressed ?? ((b: BookAdmin) => { });
        const removeBook = this.props.onRemoveBookPressed ?? ((b: BookAdmin) => { });
        const markDamaged = this.props.onInstanceMarkDamagedPressed ?? ((b: BookAdmin, id: number) => { });
        const markMended = this.props.onInstanceMarkMendedPressed ?? ((b: BookAdmin, id: number) => { });
        const removeInstance = this.props.onInstanceRemovePressed ?? ((b: BookAdmin, id: number) => { });
        const showQR = this.props.onInstanceDisplayQRCodePressed ?? ((b: BookAdmin, id: number) => { });

        return <div className="book">
            <div className="header-actions">
                <h3 className="header">
                    <img src={bookIcon} alt="icon" /> „{b.title}” — {authors}
                </h3>
                <div className="flex-row librarian-actions">
                    <CustomSelect filterKey="" label="Pokaż działania" menu_mode={true}>
                        <CustomOption value="add" onClick={() => { addInstance(b) }}>Dodaj egzemplarz</CustomOption>
                        <CustomOption value="edit" onClick={() => { editBook(b) }}>Edytuj dane książki</CustomOption>
                        <CustomOption value="delete" onClick={() => { removeBook(b) }}>Usuń książkę z systemu</CustomOption>
                    </CustomSelect>
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
                    {/*<span className="label">Tagi:</span> <div className="tags">{b.keywords?.map((keyword, index) => (<div className="tag" key={index}>{keyword}</div>))}</div>*/}
                </div>
            </Collapsible>
            <Collapsible header="Egzemplarze">
                <div className="copies">
                    {b.instances.map((ins, index) =>
                        <InstanceComponent
                            index={index}
                            key={index}
                            id={ins.id}
                            status={ins.status}
                            onMarkDamagedPressed={(id) => markDamaged(b, id)}
                            onMarkMendedPressed={(id) => markMended(b, id)}
                            onRemovePressed={(id) => removeInstance(b, id)}
                            onDisplayQRCodePressed={(id) => showQR(b, id)}
                        />
                    )}
                </div>
            </Collapsible>
        </div>
    }
}

/**
 * Właściwości (props) dla komponentu InstanceComponent.
 * @property {number} index - Indeks egzemplarza na liście.
 * @property {number} id - Unikalny identyfikator egzemplarza.
 * @property {"damaged" | "available" | "rented" | "reserved"} status - Aktualny status egzemplarza.
 * @property {function} [onMarkDamagedPressed] - Funkcja wywoływana przy próbie oznaczenia egzemplarza jako zniszczony.
 * @property {function} [onMarkMendedPressed] - Funkcja wywoływana przy próbie anulowania zniszczenia egzemplarza.
 * @property {function} [onRemove] - Funkcja wywoływana przy próbie usunięcia egzemplarza.
 */
interface InstanceComponentProps {
    index: number
    id: number
    status: "damaged" | "available" | "rented" | "reserved"
    onMarkDamagedPressed?: (id: number) => void
    onMarkMendedPressed?: (id: number) => void
    onRemovePressed?: (id: number) => void
    onDisplayQRCodePressed?: (id: number) => void
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

    const markDamaged = props.onMarkDamagedPressed ?? ((insId: number) => { });
    const markMended = props.onMarkMendedPressed ?? ((insId: number) => { });
    const remove = props.onRemovePressed ?? ((insId: number) => { });
    const displayQRCode = props.onDisplayQRCodePressed ?? ((insId: number) => { });

    return <>
        <div className="copy">
            <span><b>Egzemplarz #{props.index + 1}</b> - <span className={statusClass}>{statusText}</span></span>
            <div className="actions">
                <button onClick={() => { displayQRCode(props.id) }}><img src={scannerIcon} alt=''/></button>
                <button onClick={() => { remove(props.id) }} className="borrow button" >Usuń</button>
                {buttonMarkDamagedVisible && <button onClick={() => { markDamaged(props.id) }} className="reserve button w-46" >Ozn. jako zniszczony</button>}
                {buttonMarkMendedVisible && <button onClick={() => { markMended(props.id) }} className="reserve button w-46" >Anuluj zniszczenie</button>}
            </div>
        </div>
    </>;
}