import '../assets/book_ribbon.svg';
import '../assets/book.svg';
import { Component, ReactNode } from "react";
import { type Rent, type Reservation } from "../../public/server_types.ts";
import ScannerIcon from '../assets/qr_code_scanner.svg';

/**
 * Wyświetla globalny popup z określonym identyfikatorem i danymi dodatkowymi.
 * @param {string} id - Identyfikator akcji popupa.
 * @param {any} extraInfo - Dane przekazywane do popupa (np. ID książki).
 */
const realShowPopup = (id: string, extraInfo: any) => {
  if (typeof (window as any).showPopup === 'function') {
    (window as any).showPopup(id, extraInfo);
  } else {
    console.error("Błąd: Funkcja window.showPopup nie została znaleziona.");
  }
};

/**
 * Komponent kontenera wyświetlający listę rezerwacji lub wypożyczeń.
 * @param {Object} props - Właściwości komponentu.
 * @param {ReactNode} props.children - Elementy typu ReservationComponent lub RentComponent.
 * @param {string} props.header - Tytuł sekcji.
 * @param {any} props.icon - Ikona wyświetlana przy nagłówku.
 */
export default function ProfileBookList({ children, header, icon }: { children: ReactNode, header: string, icon: any }) {
  return (
    <div className="panel books-list-container" style={{ flex: '1', minWidth: '300px' }}>
      <h3 className="header">
        <img src={icon} alt="" style={{ height: '1.5em', marginRight: '0.5em' }} />
        {header}
      </h3>
      <div style={{ overflowY: 'auto', maxHeight: '30em' }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Komponent reprezentujący pojedynczą rezerwację książki.
 */
export class ReservationComponent extends Component<{ info: Reservation }> {
  info: Reservation;

  /**
   * @param {Object} props - Zawiera obiekt informacji o rezerwacji.
   */
  constructor(props: { info: Reservation }) {
    super(props);
    this.info = props.info;
  }

  /**
   * Wywołuje popup potwierdzenia anulowania rezerwacji.
   */
  canselReservation() {
    const id = this.info.book.book_id || "unknown";
    realShowPopup('confirm_cancel', id.toString());
  }

  /**
   * Wywołuje popup potwierdzenia odbioru zarezerwowanej książki.
   */
  withdrawBook() {
    const id = this.info.book.book_id || "unknown";
    realShowPopup('confirm_pickup', id.toString());
  }

  render() {
    const { book, reserve_to } = this.info;
    const authors = book.authors.join(", ");
    const now = new Date();
    const isReady = reserve_to > now;
    const daysLeft = Math.ceil((reserve_to.getTime() - now.getTime()) / (1000 * 3600 * 24));

    const statusText = isReady
      ? `Gotowa do odbioru (pozostało ${daysLeft} dni)`
      : 'Oczekuje na dostępność';

    return (
      <div className="book-item">
        <div className="book-info">
          <span className="title">„{book.title}” — {authors}</span>
          <span className="status">{statusText}</span>
        </div>
        <div className="book-actions">
          <button className="boring" onClick={() => this.canselReservation()}>
            Anuluj rezerwację
          </button>
          {isReady && (
            <button onClick={() => this.withdrawBook()} style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
              <img src={ScannerIcon} alt="" style={{ height: '1.1em' }} />
              Odbierz
            </button>
          )}
        </div>
      </div>
    );
  }
}

/**
 * Komponent reprezentujący pojedyncze wypożyczenie książki.
 */
export class RentComponent extends Component<{ info: Rent }> {
  info: Rent;

  /**
   * @param {Object} props - Zawiera obiekt informacji o wypożyczeniu.
   */
  constructor(props: { info: Rent }) {
    super(props);
    this.info = props.info;
  }

  render() {
    const { book, return_date } = this.info;
    const authors = book.authors.join(", ");
    const now = new Date();
    const isOverdue = return_date < now;
    const dueDateStr = return_date.toLocaleDateString();

    return (
      <div className="book-item">
        <div className="book-info">
          <span className="title">„{book.title}” — {authors}</span>
          <span className="status" style={{ color: isOverdue ? '#e00000' : 'inherit' }}>
            {isOverdue
              ? <b>Termin zwrotu minął: {dueDateStr} (Prosimy o zwrot!)</b>
              : `Termin zwrotu: {dueDateStr}`}
          </span>
        </div>
        <div className="book-actions">
          <button className="boring" onClick={() => realShowPopup('confirm_prolong', book.book_id?.toString())}>
            Przedłuż
          </button>
          <button onClick={() => realShowPopup('confirm_return', book.book_id?.toString())} style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
            <img src={ScannerIcon} alt="" style={{ height: '1.1em' }} />
            Zwróć
          </button>
        </div>
      </div>
    );
  }
}