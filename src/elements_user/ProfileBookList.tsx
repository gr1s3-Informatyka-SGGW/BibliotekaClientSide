/**
 * @file Moduł zawierający komponenty do wyświetlania i zarządzania listami książek w profilu użytkownika.
 * Eksportuje:
 * - ProfileBookList - główny kontener z nagłówkiem i alertami
 * - ReservationComponent - komponent pojedynczej rezerwacji z opcjami anulowania i odbioru
 * - RentComponent - komponent pojedynczego wypożyczenia z opcjami przedłużenia i zwrotu
 *
 * Komponenty integrują się z systemem skanowania QR oraz obsługują asynchroniczne żądania do serwera.
 * @author Natalia Bardadyn
 */

import React, { Component, type ReactNode, useState } from "react";
import { type Rent, type Reservation } from "../../public/server_types.ts";
import {
    cancelReservationRequest,
    claimReservationRequest,
    extendRentRequest,
    returnBookRequest
} from "../../public/server_requests.ts";
import Popup, { Alert } from "../../public/custom_components/Popup.tsx";
import ScanButton from "./ScanButton.tsx";
import CustomTooltip from "../../public/custom_components/CustomTooltip.tsx";


/**
 * Główny kontener listy książek w profilu użytkownika.
 * Obsługuje wyświetlanie nagłówka z ikoną oraz zarządza globalnym stanem komponentu Alert dla pod-elementów.
 * @param {Object} props
 * @param {ReservationComponent[] | RentComponent[]} props.children - Lista komponentów rezerwacji lub wypożyczeń.
 * @param {string} props.header - Tytuł sekcji (np. "Moje rezerwacje").
 * @param {string} props.icon - Ścieżka do ikony wyświetlanej przy nagłówku.
 *
 * @returns JSX.Element
 */
export default function ProfileBookList({ children, header, icon }: { children: ReactNode | ReservationComponent[] | RentComponent[] | ReservationComponent | RentComponent, header: string, icon: string }) {
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
                color: '#8b2346',
                fontSize: '1.2em',
                marginBottom: '0em',
                marginTop: '0em'
            }}>
                <img src={icon as any} alt="" style={{ height: '1.2em', marginRight: '0.5em', filter: 'invert(18%) sepia(46%) saturate(3453%) hue-rotate(323deg) brightness(91%) contrast(90%)' }} />
                {header} {children ? `(${React.Children.count(children)})` : ''}
            </h3>
            <div className="books-stack" style={{ display: 'flex', flexDirection: 'column', gap: '1.5em' }}>
                {React.Children.map(children as any, (child) =>
                    React.isValidElement(child) ? React.cloneElement(child, { showAlert } as any) : child
                )}
            </div>
            <Alert
                isOpen={alertConfig.isOpen}
                setIsOpen={(val: boolean) => setAlertConfig(prev => ({ ...prev, isOpen: val as boolean }))}
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
 * @prop {Reservation} info Dane o rezerwacji.
 * @extends Component
 */
export class ReservationComponent extends Component<{ info: Reservation }> {
    info: Reservation;

    /**
     * @param {Object} props - Zawiera obiekt info typu Reservation.
     */
    constructor(props: any) {
        super(props);
        this.info = props.info;
        this.state = { isDetailsOpen: false };
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
        const { book } = this.info;
        const { showAlert } = this.props as any;

        // Prosta weryfikacja: czy kod QR zawiera ID książki
        if (code === book.book_id?.toString()) {
            this.withdrawBook();
        } else {
            showAlert("Błąd skanowania", "Zeskanowany kod nie odpowiada tej książce.");
        }
    }
    /**
     * Renderuje listę szczegółowych informacji o książce.
     * @param {any} book - Obiekt danych książki do wyświetlenia.
     * @returns {JSX.Element}
     */
    renderBookDetails(book: any): React.JSX.Element{
        const labelStyle = { color: '#8b2346', fontWeight: 'bold', width: '150px', display: 'inline-block' };
        const rowStyle = { marginBottom: '8px', display: 'flex' };

        return (
            <div style={{ fontSize: '1em', color: '#333', textAlign: 'left' }}>
                <div style={rowStyle}><span style={labelStyle}>Tytuł:</span> <span>{book.title}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Autor:</span> <span>{book.authors.join(", ")}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Rok wydania:</span> <span>{book.publish_year}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Wydawnictwo:</span> <span>{book.publisher}</span></div>
                <div style={rowStyle}><span style={labelStyle}>ISBN:</span> <span>{book.isbn_number}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Gatunek:</span> <span>{book.genre.join(", ")}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Język:</span> <span>{book.language}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Liczba stron:</span> <span>{book.length}</span></div>
                <div style={{ marginTop: '15px', fontStyle: 'italic', color: '#666' }}>
                    Tagi: {book.keywords.join(", ")}
                </div>
            </div>
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
        const { isDetailsOpen } = this.state as any;
        return (
            <div className="book-item" style={{ paddingBottom: '0.5em', display: 'block' }}>
                <div style={{ marginBottom: '1em' }}>
                    <div
                        onClick={() => this.setState({ isDetailsOpen: true })}
                        style={{ color: '#8b2346', fontWeight: '500', fontSize: '1.1em', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        „{book.title}” - {authors}
                    </div>
                    <div style={{ color: isReady ? '#666' : '#e00000', fontSize: '0.9em', fontStyle: 'italic', marginTop: '4px', fontWeight: isReady ? 'normal' : 'bold' }}>
                        {isReady ?
                            (diffDays === 0 ? "Ostatni dzień na odbiór!"
                                : `Odbierz książkę w przeciągu ${diffDays} dni`)
                            : 'Termin odbioru minął'
                        }
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => this.cancelReservation()}
                        style={{ backgroundColor: '#8b2346', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '0.75em', cursor: 'pointer' }}
                    >
                        Anuluj rezerwację
                    </button>
                    {isReady && (
                        <ScanButton onScan={(val: string) => this.onScanWithdraw(val)} >

                        </ScanButton>
                    )}
                </div>
                <Popup
                    title="Szczegóły książki"
                    isOpen={isDetailsOpen}
                    setIsOpen={(val: boolean) => this.setState({ isDetailsOpen: val })}
                >
                    {this.renderBookDetails(book)}
                    <div style={{
                        marginTop: '20px', display: 'flex', justifyContent: 'center'
                    }}>
                        <button
                            onClick={() => this.setState({ isDetailsOpen: false })}
                            style={{
                                backgroundColor: '#8b2346', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '0.75em', cursor: 'pointer'
                            }}
                        >
                            Zamknij
                        </button>
                    </div>
                </Popup>
            </div>
        );
    }
}

/**
 * Reprezentuje pojedynczą pozycję na liście aktualnych wypożyczeń.
 * @prop {Rent} info Dane o wypożyczeniu.
 * @extends Component
 */
export class RentComponent extends Component<{ info: Rent }> {
    info: Rent;

    /**
     * @param {Object} props - Zawiera obiekt info typu Rent.
     */
    constructor(props: { info: Rent }) {
        super(props);
        this.info = props.info;
        this.state = { isDetailsOpen: false };
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
        const { book } = this.info;
        const { showAlert } = this.props as any;

        // Prosta weryfikacja: czy kod QR zawiera ID książki
        if (code === book.book_id?.toString()) {
            this.returnBook();
        } else {
            showAlert("Błąd skanowania", "Zeskanowany kod nie odpowiada tej książce.");
        }
    }
    /**
     * Renderuje listę szczegółowych informacji o książce.
     * @param {any} book - Obiekt danych książki do wyświetlenia.
     * @returns {JSX.Element}
     */
    renderBookDetails(book: any): React.JSX.Element{
        const labelStyle = { color: '#8b2346', fontWeight: 'bold', width: '150px', display: 'inline-block' };
        const rowStyle = { marginBottom: '8px', display: 'flex' };

        return (
            <div style={{ fontSize: '1em', color: '#333', textAlign: 'left' }}>
                <div style={rowStyle}><span style={labelStyle}>Tytuł:</span> <span>{book.title}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Autor:</span> <span>{book.authors.join(", ")}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Rok wydania:</span> <span>{book.publish_year}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Wydawnictwo:</span> <span>{book.publisher}</span></div>
                <div style={rowStyle}><span style={labelStyle}>ISBN:</span> <span>{book.isbn_number}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Gatunek:</span> <span>{book.genre.join(", ")}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Język:</span> <span>{book.language}</span></div>
                <div style={rowStyle}><span style={labelStyle}>Liczba stron:</span> <span>{book.length}</span></div>
                <div style={{ marginTop: '15px', fontStyle: 'italic', color: '#666' }}>
                    Tagi: {book.keywords.join(", ")}
                </div>
            </div>
        );
    }
    render() {
        const { book, return_date } = this.props.info;
        const authors = book.authors.join(", ");
        const now = new Date();
        const dueDate = return_date ? new Date(return_date) : new Date();
        const isOverdue = dueDate < now;
        const { isDetailsOpen } = this.state as any;
        return (

            <div className="book-item" style={{ paddingBottom: '0.5em', display: 'block' }}>
                <div style={{ marginBottom: '1em' }}>
                    <div
                        onClick={() => this.setState({ isDetailsOpen: true })}
                        style={{ color: '#8b2346', fontWeight: '500', fontSize: '1.1em', textDecoration: 'underline', cursor: 'pointer' }}
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
                    {!isOverdue && (
                        <button
                            onClick={() => this.prolongRental()}
                            style={{ backgroundColor: '#8b2346', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '0.75em', cursor: 'pointer' }}
                        >
                            Przedłuż
                        </button>
                    )}
                    {isOverdue ?
                        <CustomTooltip title='Aby oddać książkę udaj się do bibliotekarza, aby uregulować płatność'>
                            <button disabled={true} className='boring'>Zwróć</button>
                        </CustomTooltip>
                        :
                        <ScanButton onScan={(val:string) => this.onScanReturn(val)} text='Zwróć'/>
                    }
                </div>
                <Popup
                    title="Szczegóły książki"
                    isOpen={isDetailsOpen}
                    setIsOpen={(val: boolean) => this.setState({ isDetailsOpen: val })}
                >
                    {this.renderBookDetails(book)}
                    <div style={{
                        marginTop: '20px', display: 'flex', justifyContent: 'center'
                    }}>
                        <button
                            onClick={() => this.setState({ isDetailsOpen: false })}
                            style={{
                                backgroundColor: '#8b2346', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '0.75em', cursor: 'pointer'
                            }}
                        >
                            Zamknij
                        </button>
                    </div>
                </Popup>
            </div>
        );
    }
}
