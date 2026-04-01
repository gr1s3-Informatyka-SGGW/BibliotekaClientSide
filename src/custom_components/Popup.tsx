/**
 * @file Implementacja komponentów <Popup> i <Alert>.
 * @author Dawid Filipek
 */

import React, {type ReactNode, useState} from "react";
import { createPortal } from "react-dom";
import './Popup.css';
/**
 * @interface PopupProps
 * @property {string} title - Tekst wyświetlany w nagłówku okna.
 * @property {string} [icon] - Opcjonalna ścieżka do pliku ikony (SVG/PNG).
 * @property {ReactNode} children - Zawartość renderowana wewnątrz okna.
 * @property {boolean} isOpen - wartość hook'a obsługującego zamykanie i otwieranie okna
 * @property {React.Dispatch<React.SetStateAction<boolean>>| ((isOpen: boolean) => void)} setIsOpen - setter isOpen
 * @property {()=>void} [onClose] - event wywołany przy zamknięciu okna poprzez kliknięcie escape lub poza komponent
 */
export interface PopupProps {
    title: string;
    icon?: string;
    children: ReactNode;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>> | ((isOpen: boolean) => void);
    onClose?: ()=> void
}

/**
 * @interface AlertProps
 * @property {string} message - Treść komunikatu wyświetlanego wewnątrz alertu.
 * @property {string} title - Tekst wyświetlany w nagłówku okna.
 * @property {string} [icon] - Opcjonalna ścieżka do pliku ikony (SVG/PNG).
 * @property {boolean} isOpen - wartość hook'a obsługującego zamykanie i otwieranie okna
 * @property {React.Dispatch<React.SetStateAction<boolean>>| ((isOpen: boolean) => void)} setIsOpen - setter isOpen
 *
 * @property {() => void} [onCancel] - Callback wywoływany przy rezygnacji/zamknięciu okna.
 * @property {() => void} [onAccept] - KLUCZOWY PARAMETR: Przesłanie tej funkcji powoduje 
 * automatyczne wyrenderowanie drugiego przycisku (akceptacji). Jeśli parametr jest pominięty, 
 * Alert wyświetla tylko jeden przycisk (informacyjny).
 *
 * @property {string} [acceptText] - Tekst przycisku akceptacji (domyślnie "Tak").
 * @property {string} [cancelText] - Tekst przycisku anulowania. Domyślnie "Anuluj", a jeśli onAccept nie został podany — "Ok".
 */
export interface AlertProps{
    message: string;
    title: string;
    icon?: string;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>> | ((isOpen: boolean) => void);

    onCancel?: () => void;
    onAccept?: () => void;

    acceptText?: string;
    cancelText?: string;
}



/**
 * @function Popup
 * @description Uniwersalne okno modalne. Można je zamknąć poprzez tło, klawisz ESC
 * lub recznie poprzez wywołanie setera odpowiadającego jej hook'a isOpen
 * @example
 * // prosty popup z guzikiem, który go zamyka
 * const [isPopupOpen, setIsPopupOpen] = useState<boolean>(true)
 * return <Popup title="Szczegóły książki" isOpen={isPopupOpen} setIsOpen={setIsPopupOpen}>
 *     <button onClick={() => setIsPopupOpen(false)}>
 *         Zamknij tę zawartość
 *     </button>
 * </Popup>
 */
export default function Popup({ title, icon, children, isOpen,  setIsOpen, onClose}: PopupProps){

    /**
     * @event handleEscape
     * zamyka okno, gdy zostanie kliknięty escape
     * @prop {React.KeyboardEvent<HTMLDivElement>} event
     * @returns void
     * */
    const handleEscape: React.KeyboardEventHandler<HTMLDivElement> = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape'){
            setIsOpen(false)
            if(onClose) onClose();
        }
    };

    return isOpen && createPortal(
        <div className="popup-backdrop" onKeyDown={handleEscape} onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
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
/**
 * @function Alert
 * @description Komponent okna dialogowego z predefiniowaną strukturą komunikatu
 * oraz przyciskami akcji. Obsługuje inteligentne dopasowanie tekstów przycisków.
 * @param {AlertProps} props
 */
export function Alert({ title, message, isOpen, setIsOpen, icon, onAccept, onCancel, acceptText, cancelText }: AlertProps){


    const handleAcceptClick = () => {
        setIsOpen(false)
        if (onAccept) onAccept();
    };

    const handleCancelClick = () => {
        setIsOpen(false)
        if (onCancel) onCancel();
    };



    // Logika domyślnych tekstów: "Tak/Anuluj" dla dwóch opcji, "Ok" dla pojedynczej informacji.
    const finalCancelText = cancelText || (onAccept ? "Anuluj" : "Ok");
    const finalAcceptText = acceptText || "Tak";

    return (
        <Popup title={title} isOpen={isOpen} setIsOpen={setIsOpen} onClose={onCancel} icon={icon}>
            <div className="alert-message">{message}</div>
            <div className="alert-actions">
                {onAccept && (
                    <button onClick={handleAcceptClick} className="save-button">
                        {finalAcceptText}
                    </button>
                )}
                <button onClick={handleCancelClick} className="cancel-button">
                    {finalCancelText}
                </button>
            </div>
        </Popup>
    )
}
