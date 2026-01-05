import '../assets/book_ribbon.svg'
import '../assets/book.svg'
import React, { Component, useState } from "react";
import { type Rent, type Reservation } from "../../public/server_types.ts";
import {
    cancelReservationRequest,
    claimReservationRequest,
    extendRentRequest,
    returnBookRequest
} from "../../public/server_requests.ts";
import { Alert } from "../../public/custom_components/Popup.tsx";
import ScanButton from "./ScanButton.tsx";

const mainColor = '#8b2346';

/**
 * Główny kontener listy książek w profilu użytkownika.
 * Obsługuje wyświetlanie nagłówka z ikoną oraz zarządza globalnym stanem komponentu Alert dla podelementów.
 * * @param {Object} props
 * @param {ReservationComponent[] | RentComponent[]} props.children - Lista komponentów rezerwacji lub wypożyczeń.
 * @param {string} props.header - Tytuł sekcji (np. "Moje rezerwacje").
 * @param {ImageBitmap} props.icon - Ikona wyświetlana przy nagłówku.
 */
export default function ProfileBookList({ children, header, icon, count }: { children: ReservationComponent[] | RentComponent[], header: string, icon: ImageBitmap, count?: number }) {
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onAccept?: () => void;
    }>({ isOpen: false, title: "", message: "" });

    const showAlert = (title: string, message: string, onAccept?: () => void) => {
        setAlertConfig({ isOpen: true, title, message, onAccept });
    };
    return (
        <div className="panel" style={{
            background: 'white',
            padding: '1.5em',
            borderRadius: '0.5em',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            textAlign: 'left'
        }}>
            <h3 className="header" style={{
                display: 'flex',
                alignItems: 'center',
                color: mainColor,
                fontSize: '1.2em',
                marginBottom: '0em',
                marginTop: '0em'
            }}>
                <img src={icon as any} alt="" style={{ height: '1.2em', marginRight: '0.5em', filter: 'invert(18%) sepia(46%) saturate(3453%) hue-rotate(323deg) brightness(91%) contrast(90%)' }} />
                {header} {children ? `(${React.Children.count(children)})` : ''}            </h3>
            <div className="books-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.5em' }}>
                {React.Children.map(children as any, (child) =>
                    React.isValidElement(child) ? React.cloneElement(child, { showAlert } as any) : child
                )}
            </div>
            <Alert
                isOpen={alertConfig.isOpen}
                setIsOpen={(val) => setAlertConfig(prev => ({ ...prev, isOpen: val as boolean }))}
                title={alertConfig.title}
                message={alertConfig.message}
                onAccept={alertConfig.onAccept}
                cancelText="Zamknij"
            />
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
        const { book } = this.info;
        const { showAlert } = this.props as any;
        showAlert(
            "Anulowanie rezerwacji",
            `Czy na pewno chcesz anulować rezerwację książki „${book.title}”?`,
            async () => {
                try {
                    await cancelReservationRequest(book.book_id!);
                    showAlert("Rezerwacja anulowana");
                } catch (e: any) {
                    showAlert(e.message);
                }
            }
        );
    }

    /** Wywołuje popup odbioru zarezerwowanej książki. */
    withdrawBook() {
        const { book } = this.info;
        const { showAlert } = this.props as any;
        showAlert(
            "Odbiór książki",
            `Czy chcesz teraz odebrać zarezerwowaną książkę „${book.title}”?`,
            async () => {
                try {
                    await claimReservationRequest(book.book_id!);
                    showAlert("Sukces", "Książka została odebrana.");
                } catch (e: any) {
                    showAlert("Błąd", e.message);
                }
            }
        );
    }
    /**
     * Obsługuje wynik skanowania kodu QR podczas próby odbioru książki.
     * @param {string} code - Odczytany kod z czytnika QR.
     */
    onScanWithdraw(code: string) {
        const { showAlert } = this.props as any;
        showAlert(
            "Skanowanie QR",
            `Zeskanowano kod: ${code}. Funkcja odbioru książki przez QR nie jest jeszcze zaimplementowana.`
        );
    }
    render() {
        const { book, reserve_to } = this.props.info;
        const authors = book.authors.join(", ");
        const now = new Date();
        const deadline = new Date(reserve_to);
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isReady = !isNaN(deadline.getTime()) && diffDays >= 0;
        return (
            <div className="book-item" style={{ paddingBottom: '0.5em', display: 'block' }}>
                <div style={{ marginBottom: '1em' }}>
                    <div
                        style={{ color: mainColor, fontWeight: '500', fontSize: '1.1em', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        „{book.title}” - {authors}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9em', fontStyle: 'italic', marginTop: '4px' }}>
                        {isReady
                            ? (diffDays === 0 ? "Ostatni dzień na odbiór!" : `Pozostało dni na odbiór: ${diffDays}`)
                            : 'Oczekuje na dostępność lub termin odbioru minął'
                        }
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
                        <ScanButton pass_output={(val) => this.onScanWithdraw(val)}>
                            Odbierz
                        </ScanButton>
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
        const { book } = this.info;
        const { showAlert } = this.props as any;
        showAlert(
            "Przedłużenie wypożyczenia",
            `Czy chcesz przedłużyć termin zwrotu książki „${book.title}” o 30 dni?`,
            async () => {
                try {
                    await extendRentRequest(book.book_id!);
                    showAlert("Sukces", "Termin zwrotu został przesunięty.");
                } catch (e: any) {
                    showAlert("Błąd", e.message);
                }
            }
        );
    }
    /** Wywołuje popup oddania książki. */
    returnBook() {
        const { book } = this.info;
        const { showAlert } = this.props as any;
        showAlert(
            "Zwrot książki",
            `Czy chcesz potwierdzić zwrot książki „${book.title}”?`,
            async () => {
                try {
                    await returnBookRequest(book.book_id!);
                    showAlert("Sukces", "Książka została zwrócona. Dziękujemy!");
                } catch (e: any) {
                    showAlert("Błąd", e.message);
                }
            }
        );
    }
    /**
     * Obsługuje wynik skanowania kodu QR podczas procesu zwrotu książki.
     * @param {string} code - Odczytany kod z czytnika QR.
     */
    onScanReturn(code: string) {
        const { showAlert } = this.props as any;
        showAlert(
            "Skanowanie QR",
            `Zeskanowano kod: ${code}. Funkcja zwrotu książki przez QR nie jest jeszcze zaimplementowana.`
        );
    }
    render() {
        const { book, return_date } = this.props.info;
        const authors = book.authors.join(", ");
        const now = new Date();
        const dueDate = return_date ? new Date(return_date) : new Date();
        const isOverdue = dueDate < now;

        return (

            <div className="book-item" style={{ paddingBottom: '0.5em', display: 'block' }}>
                <div style={{ marginBottom: '1em' }}>
                    <div
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
                    <ScanButton pass_output={(val) => this.onScanReturn(val)}>
                        Zwróć
                    </ScanButton>
                </div>
            </div>
        );
    }
}
