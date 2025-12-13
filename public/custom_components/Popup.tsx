/**
 * @file Plik implementuje komponent <Popup> wyświetlający komunikaty na środku ekranie i blokując resztę strony na czas wyświetlania komunikatu
 * @author Dawid Filipek
 * */
import React, {createContext, type ReactNode, useContext, useState, useEffect, type JSX} from "react";
import { createPortal } from "react-dom";
import './Popup.css';

/**
 * Kontekst dostarczający funkcję zamykania modalu ('close')
 * komponentom umieszczonym wewnątrz <Popup>.
 * Używany do wywołania funkcji onClose przekazanej z komponentu nadrzędnego.
 * @var {React.Context<() => void>} popupContext
 */
export const popupContext: React.Context<() => void> = createContext(() => {
});

/**
 * Hook ułatwiający komponentom potomnym zamknięcie modalu.
 * Umożliwia komponentom wewnętrznym (np. przyciskom) dostęp do funkcji zamknięcia
 * modalu dostarczonej przez <popupContext.Provider>.
 * @returns {() => void} Funkcja zamykająca modal.
 */
export const usePopupClose = () => useContext(popupContext);

/**
 * @type PopupProps
 * @property {ReactNode} children - Zawartość wyświetlana wewnątrz wyskakującego okna.
 * @property {string} [title] - Opcjonalny nagłówek wyświetlany na górze okna.
 * @property {string} [title_icon] - Opcjonalna ścieżka do zasobu (URL/import) ikony wyświetlanej obok nagłówka.
 * @property {boolean} isOpen - Stan otwarcia/zamknięcia modalu. MUSI BYĆ KONTROLOWANY Z ZEWNĄTRZ.
 * @property {() => void} onClose - Funkcja wywoływana, gdy modal ma zostać zamknięty (np. kliknięcie tła, ESC, przycisk wewnętrzny).
 */
interface PopupProps {
    children: ReactNode;
    title?: string;
    title_icon?: string; 
    isOpen: boolean;
    onClose: () => void; 
}

/**
 * Komponent Popup (modal) wyświetlający zawartość na środku ekranu.
 * Używa React Portals do renderowania się poza drzewem DOM. 
 * Tło jest rozmywane i blokuje interakcję z resztą strony.
 * Okno zamyka się po kliknięciu poza nim, naciśnięciu ESC lub wywołaniu funkcji 'close' z kontekstu.
 *
 * @param {PopupProps} props - Właściwości komponentu.
 * @returns {JSX.Element | null} - Zwraca komponent React (Portal) lub null, gdy zamknięty.
 */

export default function Popup({ children, title, title_icon, isOpen, onClose }: PopupProps): JSX.Element | null {
    
    const close = () => {
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            close();
        }
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                close();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]); 

    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div className="popup-backdrop" onClick={handleBackdropClick}>
            
            <div className="popup-window">
                
                {(title || title_icon) && (
                    <div className="popup-header">
                        {title_icon && (
                            <img src={title_icon} alt="Ikona komunikatu" className="popup-icon" />
                        )}
                        {title && <h3 className="popup-title">{title}</h3>}
                    </div>
                )}
                
                <div className="popup-content">
                    <popupContext.Provider value={close}>
                        {children}
                    </popupContext.Provider>
                </div>
                
            </div>
            
        </div>,
        document.body
    );
}

/**
 * @type {object} AlertProps
 * @property {string} message - Treść komunikatu wyświetlanego w oknie.
 * @property {string} title - Nagłówek okna.
 * @property {boolean} isOpen - Stan otwarcia/zamknięcia modalu.
 * @property {() => void} onClose - Funkcja wywoływana przy zamknięciu modalu.
 */

interface AlertProps {
    message: string;
    title: string;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Definiuje typowe okno potwierdzające lub informacyjne (Alert).
 * Jest to komponent opakowujący <Popup> z predefiniowanym układem (wiadomość + przycisk Zamknij).
 * @param {AlertProps} props - Właściwości komponentu Alert.
 * @returns {JSX.Element} - Zwraca komponent Popup.
 */
export function Alert({ message, title, isOpen, onClose }: AlertProps): JSX.Element {
    return (
        <Popup title={title} isOpen={isOpen} onClose={onClose}>
            <div className="alert-message">{message}</div>
            <div className="alert-actions">
                <CloseButton>Zamknij</CloseButton>
            </div>
        </Popup>
    );
}

/**
 * Pomocniczy komponent do tworzenia przycisków, które zamykają modal.
 * Używa hooka usePopupClose, aby uzyskać funkcję zamknięcia z kontekstu.
 * @param {object} props — Właściwości komponentu.
 * @param {ReactNode} props.children - Zawartość przycisku (np. tekst).
 * @returns {JSX.Element} - Przycisk HTML.
 */

const CloseButton: React.FC<{ children: ReactNode }> = ({ children }: { children: ReactNode}): JSX.Element => {
    const close = usePopupClose();
    return <button onClick={close}>{children}</button>;
};
