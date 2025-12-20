/**
 * @file Plik implementuje zestaw komponentów okien modalnych: <Popup> oraz <Alert>.
 * @author Dawid Filipek
 */

import React, { createContext, type ReactNode, useContext, useState, useEffect, type JSX } from "react";
import { createPortal } from "react-dom";
import './Popup.css';

// ----------------------------------------------------------------------
// KONTEKST I HOOKI
// ----------------------------------------------------------------------

/**
 * Kontekst przechowujący funkcję zamykającą aktualnie otwarte okno modalne.
 * Pozwala komponentom zagnieżdżonym głęboko w `children` na wywołanie zamknięcia.
 */
export const popupContext: React.Context<() => void> = createContext(() => {});

/**
 * Hook pomocniczy do uzyskania dostępu do funkcji zamykającej modal.
 * @returns {() => unknown} Funkcja zamykająca modal.
 */
export const usePopupClose = () => useContext(popupContext);

// ----------------------------------------------------------------------
// INTERFEJSY
// ----------------------------------------------------------------------

/**
 * @interface PopupProps
 * @description Właściwości dla ogólnego komponentu Popup.
 * @property {string} title - Tekst wyświetlany w nagłówku okna.
 * @property {string} [icon] - Opcjonalna ścieżka do pliku graficznego ikony nagłówka.
 * @property {ReactNode} children - Zawartość renderowana wewnątrz sekcji body modala.
 * @property {() => void} [onClose] - Callback wykonywany w momencie zamykania komponentu.
 */
export interface PopupProps {
    title: string;
    icon?: string;
    children: ReactNode;
    onClose?: () => void;
}

/**
 * @interface AlertProps
 * @description Właściwości dla uproszczonego okna dialogowego typu Alert.
 * @property {string} title - Tekst nagłówka.
 * @property {string} message - Główna treść komunikatu.
 * @property {string} [icon] - Opcjonalna ścieżka do ikony nagłówka.
 * @property {() => void} [onClose] - Callback wywoływany przy anulowaniu lub zamknięciu.
 * @property {() => void} [onAccept] - Callback wywoływany po kliknięciu przycisku akceptacji.
 * @property {string} [acceptText] - Tekst na przycisku potwierdzenia (domyślnie 'Tak').
 * @property {string} [cancelText] - Tekst na przycisku anulowania (domyślnie 'Nie').
 */
export interface AlertProps {
    title: string;
    message: string;
    icon?: string;
    onClose?: () => void;
    onAccept?: () => void;
    acceptText?: string;
    cancelText?: string;
}

// ----------------------------------------------------------------------
// KOMPONENTY WEWNĘTRZNE
// ----------------------------------------------------------------------

/**
 * Bazowy komponent strukturalny dla wszystkich okien modalnych.
 * Obsługuje Portal, tło (backdrop), zamykanie klawiszem ESC oraz warunkowe renderowanie ikony.
 * @private
 * @param {Object} props - Właściwości komponentu.
 * @param {ReactNode} props.children - Zawartość okna.
 * @param {string} props.title - Tytuł nagłówka.
 * @param {string} [props.icon] - Ścieżka do ikony.
 * @param {boolean} props.isOpen - Czy okno jest obecnie zamontowane.
 * @param {() => void} props.handleClose - Funkcja wyzwalająca proces zamykania.
 */
function _BaseModal({ children, title, icon, isOpen, handleClose }: any) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, handleClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="popup-backdrop" onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <popupContext.Provider value={handleClose}>
                <div className="popup-window">
                    <div className="popup-header">
                        {/* Renderowanie ikony, tylko jeśli string nie jest pusty */}
                        {icon && icon.trim() !== "" && (
                            <img src={icon} alt="" className="popup-icon" />
                        )}
                        <h3 className="popup-title">{title}</h3>
                    </div>
                    <div className="popup-content">{children}</div>
                </div>
            </popupContext.Provider>
        </div>,
        document.body
    ); 
}

// ----------------------------------------------------------------------
// KOMPONENTY EKSPORTOWANE
// ----------------------------------------------------------------------

/**
 * Komponent Popup.
 * Uniwersalny kontener modalny, który sam zarządza swoim stanem otwarcia.
 * Zamyka się po kliknięciu, w tło klawiszu ESC lub wywołaniu funkcji z kontekstu.
 * @param {PopupProps} props — Parametry konfiguracyjne popupu.
 * @returns {JSX.Element | null}
 */
export default function Popup({ title, icon, children, onClose }: PopupProps): JSX.Element | null {
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    return (
        <_BaseModal title={title} icon={icon} isOpen={isOpen} handleClose={handleClose}>
            {children}
        </_BaseModal>
    );
}

/**
 * Komponent Alert.
 * Specjalizowana wersja okna modalnego służąca do potwierdzania akcji.
 * Posiada predefiniowany układ z wiadomością tekstową oraz dwoma przyciskami akcji.
 * @param {AlertProps} props - Parametry konfiguracyjne alertu.
 * @returns {JSX.Element | null}
 */
export function Alert({ 
    title, message, icon, onClose, onAccept, 
    acceptText = "Tak", cancelText = "Nie" 
}: AlertProps): JSX.Element | null {
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    /**
     * Obsługuje kliknięcie przycisku akceptacji, wykonuje callback i zamyka okno.
     */
    const handleAccept = () => {
        if (onAccept) onAccept();
        handleClose();
    };

    return (
        <_BaseModal title={title} icon={icon} isOpen={isOpen} handleClose={handleClose}>
            <div className="alert-message">{message}</div>
            <div className="alert-actions">
                {/* Kolejność: Przycisk akceptacji po lewej, Anuluj po prawej */}
                {onAccept && (
                    <button onClick={handleAccept} className="save-button">{acceptText}</button>
                )}
                <button onClick={handleClose} className="cancel-button">{cancelText}</button>
            </div>
        </_BaseModal>
    );
}