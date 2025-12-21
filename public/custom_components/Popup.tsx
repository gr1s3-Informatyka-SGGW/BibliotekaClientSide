/**
 * @file Implementacja komponentów <Popup> i <Alert> oparta na klasach React.
 * Komponenty te udostępniają publiczną metodę close(), która umożliwia ich 
 * zamykanie przy użyciu referencji (React Ref) bez konieczności używania kontekstu.
 * * @author Dawid Filipek
 */

import React, { type ReactNode } from "react";
import { createPortal } from "react-dom";
import './Popup.css';

/**
 * @interface PopupProps
 * @property {string} title - Tekst wyświetlany w nagłówku okna.
 * @property {string} [icon] - Opcjonalna ścieżka do pliku ikony (SVG/PNG).
 * @property {ReactNode} children - Zawartość renderowana wewnątrz okna.
 * @property {() => void} [onClose] - Callback wywoływany po zamknięciu komponentu.
 */
export interface PopupProps {
    title: string;
    icon?: string;
    children: ReactNode;
    onClose?: () => void;
}

/**
 * @interface AlertProps
 * @property {string} title - Tekst nagłówka okna.
 * @property {string} message - Treść komunikatu wyświetlanego wewnątrz alertu.
 * @property {string} [icon] - Opcjonalna ścieżka do pliku ikony.
 * @property {() => void} [onCancel] - Callback wywoływany przy rezygnacji/zamknięciu okna.
 * @property {() => void} [onAccept] - KLUCZOWY PARAMETR: Przesłanie tej funkcji powoduje 
 * automatyczne wyrenderowanie drugiego przycisku (akceptacji). Jeśli parametr jest pominięty, 
 * Alert wyświetla tylko jeden przycisk (informacyjny).
 * @property {string} [acceptText] - Tekst przycisku akceptacji (domyślnie "Tak").
 * @property {string} [cancelText] - Tekst przycisku anulowania. Domyślnie "Anuluj", 
 * a jeśli onAccept nie został podany — "Ok".
 */
export interface AlertProps {
    title: string;
    message: string;
    icon?: string;
    onCancel?: () => void;
    onAccept?: () => void;
    acceptText?: string;
    cancelText?: string;
}

/**
 * @interface PopupState
 * @private
 * @property {boolean} isOpen - Flaga sterująca widocznością komponentu w DOM.
 */
interface PopupState {
    isOpen: boolean;
}

/**
 * @class Popup
 * @extends {React.Component<PopupProps, PopupState>}
 * @description Uniwersalne okno modalne. Można je zamknąć poprzez tło, klawisz ESC 
 * lub wywołując publiczną metodę close() przez referencję.
 * @prop {Popup} currentlyOpen statyczna referencja do obecnie otwartego okna
 * @example
 * // prosty popup z guzikiem, który go zamyka
 * <Popup title="Szczegóły książki">
 *     <button onClick={() => Popup.currentlyOpen?.close()}>
 *         Zamknij tę zawartość
 *     </button>
 * </Popup>
 */
export default class Popup extends React.Component<PopupProps, PopupState> {
    /**
     * Statyczny element umożliwiający łatwe odniesienie do obecnie otwartego popupu,
     * aby użyć go w środku tego komponentu, należy umieścić go w funkcji lambda
     * @example
     * // onClick dla elementu w środku tego komponentu
     * ()=> currentlyOpen.close()
     * @static
     * */
    static currentlyOpen: Popup

    constructor(props: PopupProps) {
        super(props);
        this.state = { isOpen: true };
        Popup.currentlyOpen?.close(); // zamknij, jeśli jakiś jest już otwarty
        Popup.currentlyOpen = this
    }

    /**
     * Publiczna metoda zamykająca okno.
     * Zmienia stan wewnętrzny i wywołuje opcjonalny callback onClose.
     * @public
     */
    public close = () => {
        console.log(this.state.isOpen)
        this.setState({ isOpen: false });
        if (this.props.onClose) this.props.onClose();
    };

    /**
     * Obsługuje zamykanie okna klawiszem Escape.
     * @private
     */
    private handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.close();
    };

    componentDidMount() {
        document.addEventListener('keydown', this.handleEscape);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleEscape);
    }

    render() {
        if (!this.state.isOpen) return null;

        const { title, icon, children } = this.props;

        return createPortal(
            <div 
                className="popup-backdrop" 
                onClick={(e) => e.target === e.currentTarget && this.close()}
            >
                <div className="popup-window">
                    <div className="popup-header">
                        {icon && icon.trim() !== "" && <img src={icon} alt="" className="popup-icon" />}
                        <h3 className="popup-title">{title}</h3>
                    </div>
                    <div className="popup-content">{children}</div>
                </div>
            </div>,
            document.body
        );
    } 
}

/**
 * @class Alert
 * @extends {React.Component<AlertProps, PopupState>}
 * @description Komponent okna dialogowego z predefiniowaną strukturą komunikatu 
 * oraz przyciskami akcji. Obsługuje inteligentne dopasowanie tekstów przycisków.
 */
export class Alert extends React.Component<AlertProps, PopupState> {
    constructor(props: AlertProps) {
        super(props);
        this.state = { isOpen: true };
    }

    /**
     * Publiczna metoda zamykająca Alert (traktowana jako anulowanie/zamknięcie).
     * @public
     */
    public close = () => {
        this.setState({ isOpen: false });
        if (this.props.onCancel) this.props.onCancel();
    };

    /**
     * Wywołuje przekazaną akcję akceptacji. Zgodnie z logiką, 
     * akceptacja nie zamyka okna automatycznie (wymaga ręcznego wywołania .close()).
     * @private
     */
    private handleAcceptClick = () => {
        if (this.props.onAccept) this.props.onAccept();
    };

    render() {
        if (!this.state.isOpen) return null;

        const { title, message, icon, onAccept, acceptText, cancelText } = this.props;
        
        // Logika domyślnych tekstów: "Tak/Anuluj" dla dwóch opcji, "Ok" dla pojedynczej informacji.
        const finalCancelText = cancelText || (onAccept ? "Anuluj" : "Ok");
        const finalAcceptText = acceptText || "Tak";

        return createPortal(
            <div 
                className="popup-backdrop" 
                onClick={(e) => e.target === e.currentTarget && this.close()}
            >
                <div className="popup-window">
                    <div className="popup-header">
                        {icon && icon.trim() !== "" && <img src={icon} alt="" className="popup-icon" />}
                        <h3 className="popup-title">{title}</h3>
                    </div>
                    <div className="popup-content">
                        <div className="alert-message">{message}</div>
                        <div className="alert-actions">
                            {onAccept && (
                                <button onClick={this.handleAcceptClick} className="save-button">
                                    {finalAcceptText}
                                </button>
                            )}
                            <button onClick={this.close} className="cancel-button">
                                {finalCancelText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }
}