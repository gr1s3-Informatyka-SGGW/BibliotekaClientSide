import '../assets/book_ribbon.svg'
import '../assets/book.svg'
import { Component } from "react";
import { type Rent, type Reservation } from "../../public/server_types.ts";
import ScannerIcon from '../assets/qr_code_scanner.svg';
import {cancelReservationRequest, claimReservationRequest, extendRentRequest, returnBookRequest} from '../../public/server_requests.ts'
import ScanButton from "./ScanButton.tsx";

declare global {
    interface Window {
        /** Wyświetla popup o zadanym identyfikatorze z opcjonalnymi danymi. */
        showPopup: (id: string, extraInfo?: any) => Promise<void>;
        /** Zamyka popup o zadanym identyfikatorze. */
        closePopup: (id: string) => Promise<void>;
        /** Akcja anulowania rezerwacji wywoływana z poziomu popupu. */
        confirmCancelReservation: (id: string) => void;
        /** Akcja potwierdzenia odbioru książki wywoływana z poziomu popupu. */
        confirmPickupBook: (id: string) => void;
        /** Akcja przedłużenia wypożyczenia wywoływana z poziomu popupu. */
        extendRental: (id: string) => void;
        /** Akcja zwrotu książki przez skanowanie kodu QR. */
        handleScanQR: (id: string) => void;
    }
}


const popups: Record<string, (info: any) => string> = {
    confirm_cancel: (id) => `
    <div class="panel popup" id="popup_confirm_cancel">
      <h3 class="header">Anulowanie rezerwacji</h3>
      <p>Czy na pewno chcesz anulować rezerwację tej pozycji?</p>
      <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
        <button class="boring" style="flex: 1;" onclick="closePopup('confirm_cancel')">Nie, kontynuuj rezerwację</button>
        <button style="flex: 1;" onclick="window.confirmCancelReservation('${id}'); closePopup('confirm_cancel')">Tak, anuluj rezerwację</button>
      </div>
    </div>`,
    confirm_pickup: (id) => `
    <div class="panel popup" id="popup_confirm_pickup">
      <h3 class="header">Odbiór książki</h3>
      <p>Czy książka została pobrana z półki?</p>
      <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
        <button class="boring" style="flex: 1;" onclick="closePopup('confirm_pickup')">Jeszcze nie odbieram</button>
        <button style="flex: 1;" onclick="window.confirmPickupBook('${id}'); closePopup('confirm_pickup')">Tak, książka została odebrana</button>
      </div>
    </div>`,
    confirm_prolong: (id) => `
    <div class="panel popup" id="popup_confirm_prolong">
      <h3 class="header">Przedłużenie wypożyczenia</h3>
      <p>Czy chcesz przedłużyć wypożyczenie pozycji o 30 dni?</p>
      <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
         <button class="boring" style="flex: 1;" onclick="closePopup('confirm_prolong')">Anuluj</button>
         <button style="flex: 1;" onclick="window.extendRental('${id}'); closePopup('confirm_prolong')">Tak, przedłuż</button>
      </div>
    </div>`,
    confirm_return: (id) => `
    <div class="panel popup" id="popup_confirm_return">
      <h3 class="header">Zwrot książki</h3>
      <p>Czy książka została odłożona w wyznaczonym miejscu zwrotu?</p>
      <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
        <button class="boring" style="flex: 1;" onclick="closePopup('confirm_return')">Jeszcze nie zwracam</button>
        <button style="flex: 1;" onclick="window.handleScanQR('${id}'); closePopup('confirm_return')">Tak, zwróć</button>
      </div>
    </div>`,
    book_info: (title) => `
    <div class="panel popup" id="popup_book_info">
      <h3 class="header">Informacje o książce</h3>
      <p>Szczegóły dla: <b>${title}</b></p>
      <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
        <button style="flex: 1;" onclick="closePopup('book_info')">Zamknij</button>
      </div>
    </div>`,
    status_info: (message) => `
    <div class="panel popup" id="popup_status_info">
      <p>${message}</p>
      <div style="display: flex; flex-direction: row; gap: 0.5em; margin-top: 1em;">
        <button style="flex: 1;" onclick="closePopup('status_info')">OK</button>
      </div>
    </div>`,
    book_details: (data: { title: string, authors: string }) => `
    <div class="panel popup" id="popup_book_details" style="min-width: 300px;">
      <h3 class="header" style="color: #8b2346;">Szczegóły pozycji</h3>
      <p style="margin-top: 1em;"><b>Tytuł:</b> ${data.title}</p>
      <p><b>Autor:</b> ${data.authors}</p>
      <div style="margin-top: 1.5em; text-align: right;">
        <button style="background-color: #8b2346; color: white; border: none; padding: 8px 20px; borderRadius: 0.75em; cursor: pointer;" onclick="closePopup('book_details')">Zamknij</button>
      </div>
    </div>`
};

/**
 * Zwraca obietnicę rozwiązującą się po określonym czasie.
 * @param {number} ms - Czas oczekiwania.
 */
function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let bg: HTMLDivElement;
if (typeof document !== 'undefined') {
    bg = document.getElementById('popup-bg') as HTMLDivElement;
    if (!bg) {
        bg = document.createElement("div");
        bg.id = 'popup-bg';
        Object.assign(bg.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '1000', display: 'none', transition: 'opacity 0.3s'
        });
        document.body.appendChild(bg);
    }
}

/**
 * Wstrzykuje i wyświetla popup w interfejsie użytkownika.
 * @param {string} id - Identyfikator popupu z rejestru.
 * @param {any} extraInfo - Dane przekazywane do szablonu popupu.
 */
async function showPopup(id: string, extraInfo: any = '') {
    const popupContent = popups[id];
    if (popupContent === undefined) {
        alert("Błąd: Nie zdefiniowano popupu o ID: " + id);
        return;
    }
    const htmlContent = popupContent(extraInfo);
    document.body.insertAdjacentHTML('beforeend', htmlContent);
    let popup = document.getElementById("popup_" + id);
    if (popup === null) return;

    popup.style.opacity = "0.0";
    bg.style.display = 'block';
    bg.style.opacity = "0.0";
    await wait(50);
    bg.style.opacity = "1.0";
    popup.style.opacity = "1.0";
    popup.style.position = 'fixed';
    popup.style.display = 'flex';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.zIndex = "1001";
}

/**
 * Usuwa popup z DOM i ukrywa tło.
 * @param {string} id - Identyfikator popupu do usunięcia.
 */
async function closePopup(id: string) {
    let popupCount = document.querySelectorAll('.popup').length;
    let popup = document.getElementById("popup_" + id);
    if (!popup) return;
    popup.style.opacity = "0.0";
    if (popupCount <= 1) {
        bg.style.opacity = "0.0";
    }
    await wait(300);
    popup.remove();
    if (popupCount <= 1) {
        bg.style.display = 'none';
    }
}

window.showPopup = showPopup;
window.closePopup = closePopup;
window.confirmCancelReservation = (id) => console.log("Anulowano rezerwację:", id);
window.confirmPickupBook = (id) => console.log("Odebrano książkę:", id);
window.extendRental = (id) => console.log("Przedłużono wypożyczenie:", id);
window.handleScanQR = (id) => console.log("Zwrócono książkę (QR):", id);

const mainColor = '#8b2346';

/**
 * Kontener wyświetlający listę książek w spójnym panelu bocznym.
 * @param {Object} props - Właściwości komponentu.
 * @param {ReservationComponent[]|RentComponent[]} props.children - Elementy ReservationComponent lub RentComponent.
 * @param {string} props.header - Tytuł sekcji.
 * @param {any} props.icon - Ikona wyświetlana przy nagłówku.
 * @param {number} [props.count] - Opcjonalny licznik elementów.
 */
export default function ProfileBookList({ children, header, icon, count }: { children: ReservationComponent[] | RentComponent[], header: string, icon: any, count?: number }) {
    return (
        <div className="panel" style={{
            background: 'white',
            padding: '1.5em',
            borderRadius: '0.5em',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            marginBottom: '1.5em',
            textAlign: 'left'
        }}>
            <h3 className="header" style={{
                display: 'flex',
                alignItems: 'center',
                color: mainColor,
                fontSize: '1.4em',
                marginBottom: '1em',
                marginTop: 0
            }}>
                <img src={icon} alt="" style={{ height: '1.2em', marginRight: '0.5em', filter: 'invert(18%) sepia(46%) saturate(3453%) hue-rotate(323deg) brightness(91%) contrast(90%)' }} />
                {header} {count !== undefined ? `(${count})` : ''}
            </h3>
            <div className="books-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.5em' }}>
                {children}
            </div>
        </div>
    );
}

/**
 * Reprezentuje pojedynczą pozycję na liście rezerwacji.
 */
export class ReservationComponent extends Component<{ info: Reservation }> {
    /** Dane o rezerwacji. */
    info: Reservation;

    /**
     * @param {Object} props - Zawiera obiekt info typu Reservation.
     */
    constructor(props: { info: Reservation }) {
        super(props);
        this.info = props.info;
    }

    /** Wywołuje popup anulowania rezerwacji. */
    cancelReservation() {
        const id = this.info.book.book_id?.toString() || "unknown";
        window.showPopup('confirm_cancel', id);
    }

    /** Wywołuje popup odbioru zarezerwowanej książki. */
    withdrawBook() {
        const id = this.info.book.book_id?.toString() || "unknown";
        window.showPopup('confirm_pickup', id);
    }

    render() {
        const { book, reserve_to } = this.info;
        const authors = book.authors.join(", ");
        const isReady = new Date(reserve_to) > new Date();

        return (
            <div className="book-item" style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5em', display: 'block' }}>
                <div style={{ marginBottom: '1em' }}>
                    <div
                        onClick={() => window.showPopup('book_details', { title: book.title, authors })}
                        style={{ color: mainColor, fontWeight: '500', fontSize: '1.1em', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        „{book.title}” - {authors}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9em', fontStyle: 'italic', marginTop: '4px' }}>
                        {isReady ? `Pozostały 3 dni na odbiór` : 'Oczekuje na dostępność'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => this.cancelReservation()}
                        style={{ backgroundColor: mainColor, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '0.75em', cursor: 'pointer' }}
                    >
                        Anuluj rezerwację
                    </button>
                    {isReady && (
                        <button
                            onClick={() => this.withdrawBook()}
                            style={{ backgroundColor: mainColor, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '0.75em', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <img src={ScannerIcon} alt="" style={{ height: '1.1em', filter: 'brightness(0) invert(1)' }} />
                            Odbierz
                        </button>
                    )}
                </div>
            </div>
        );
    }
}

/**
 * Reprezentuje pojedynczą pozycję na liście aktualnych wypożyczeń.
 */
export class RentComponent extends Component<{ info: Rent }> {
    /** Dane o wypożyczeniu. */
    info: Rent;

    /**
     * @param {Object} props - Zawiera obiekt info typu Rent.
     */
    constructor(props: { info: Rent }) {
        super(props);
        this.info = props.info;
    }

    /** Wywołuje popup przedłużenia terminu zwrotu. */
    prolongRental() {
        const id = this.info.book.book_id?.toString() || "unknown";
        window.showPopup('confirm_prolong', id);
    }

    /** Wywołuje popup procedury zwrotu książki. */
    returnBook() {
        const id = this.info.book.book_id?.toString() || "unknown";
        window.showPopup('confirm_return', id);
    }

    render() {
        const { book, return_date } = this.info;
        const authors = book.authors.join(", ");
        const now = new Date();
        const dueDate = new Date(return_date);
        const isOverdue = dueDate < now;

        return (
            <div className="book-item" style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5em', display: 'block' }}>
                <div style={{ marginBottom: '1em' }}>
                    <div
                        onClick={() => window.showPopup('book_details', { title: book.title, authors })}
                        style={{ color: mainColor, fontWeight: '500', fontSize: '1.1em', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        „{book.title}” - {authors}
                    </div>
                    <div style={{ color: isOverdue ? '#e00000' : '#666', fontSize: '0.9em', marginTop: '4px' }}>
                        {isOverdue ? (
                            <b>Termin zwrotu minął: {dueDate.toLocaleDateString()} (Prosimy o zwrot!)</b>
                        ) : (
                            `Termin zwrotu: ${dueDate.toLocaleDateString()}`
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => this.prolongRental()}
                        style={{ backgroundColor: mainColor, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '0.75em', cursor: 'pointer' }}
                    >
                        Przedłuż
                    </button>
                    <button
                        onClick={() => this.returnBook()}
                        style={{ backgroundColor: mainColor, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '0.75em', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <img src={ScannerIcon} alt="" style={{ height: '1.1em', filter: 'brightness(0) invert(1)' }} />
                        Zwróć
                    </button>
                </div>
            </div>
        );
    }
}