/**
 * @file Plik implementuje komponent <Popup> oraz <Alert> wyświetlające komunikaty na środku ekranie
 * i blokujące resztę strony na czas wyświetlania komunikatu.
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
    // Domyślna funkcja, nie robi nic. Jest tylko placeholderem.
});

/**
 * Hook ułatwiający komponentom potomnym zamknięcie modalu.
 * Umożliwia komponentom wewnętrznym (np. przyciskom) dostęp do funkcji zamknięcia
 * modalu dostarczonej przez <popupContext.Provider>.
 * @returns {() => void} Funkcja zamykająca modal.
 */
export const usePopupClose = () => useContext(popupContext);

/**
 * @interface PopupProps
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
 * Używa React Portals do renderowania się poza drzewem DOM (w elemencie document.body). 
 * Tło jest rozmywane i blokuje interakcję z resztą strony.
 * Okno zamyka się po kliknięciu poza nim, naciśnięciu ESC lub wywołaniu funkcji 'close' z kontekstu.
 *
 * @param {PopupProps} props - Właściwości komponentu.
 * @returns {JSX.Element | null} - Zwraca komponent React (Portal) lub null, gdy zamknięty.
 */

export default function Popup({ children, title, title_icon, isOpen, onClose }: PopupProps): JSX.Element | null {
    
    /**
     * Zamyka modal, wywołując funkcję przekazaną w propsie.
     */
    const close = () => {
        onClose();
    };

    /**
     * Obsługuje kliknięcie na tło (backdrop). Zamyka modal, tylko jeśli kliknięty 
     * element jest tym samym elementem, na którym wystąpiło zdarzenie (zapobiega zamknięciu po kliknięciu okna).
     * @param {React.MouseEvent<HTMLDivElement>} e - Zdarzenie kliknięcia.
     */
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            close();
        }
    };

    /**
     * Efekt odpowiedzialny za nasłuchiwanie klawisza ESC w celu zamknięcia modala.
     * Aktywuje się tylko, gdy modal jest otwarty (isOpen jest true).
     */
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
    }, [isOpen, onClose]); // onClose dodane dla pełnej poprawności zależności useEffect

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
                    {/* Dostarcza funkcję close wszystkim komponentom potomnym */}
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
 * @interface AlertProps
 * @property {ReactNode} children - Zawartość dynamiczna wyświetlana wewnątrz modala (np. formularz, komunikat JSX).
 * @property {string} title - Nagłówek okna.
 * @property {boolean} isOpen - Stan otwarcia/zamknięcia modalu.
 * @property {() => void} onClose - Funkcja wywoływana przy zamknięciu modala (przycisk 'Zamknij').
 * @property {() => void} [onSave] - Opcjonalna funkcja wywoływana przy kliknięciu 'Zapisz' (jeśli jest obecna, przycisk jest widoczny).
 */

interface AlertProps {
    children: ReactNode;
    title: string;
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
}

/**
 * Pomocniczy komponent do tworzenia przycisków akcji "Zapisz".
 * Wywołuje logikę zapisu przekazaną w propsie, a następnie zamyka modal (używając kontekstu).
 * @param {object} props - Właściwości komponentu.
 * @param {ReactNode} props.children - Zawartość przycisku (np. tekst "Zapisz").
 * @param {() => void} props.onClick - Funkcja do wykonania przed zamknięciem (logika zapisu).
 * @returns {JSX.Element} - Przycisk HTML z klasą save-button.
 */
const SaveButton: React.FC<{ children: ReactNode, onClick: () => void }> = ({ children, onClick }): JSX.Element => {
    const close = usePopupClose();
    
    const handleClick = () => {
        onClick(); // Wykonaj akcję zapisu
        close();   // Zamknij modal
    };
    
    return <button onClick={handleClick} className="save-button">{children}</button>;
};

/**
 * Definiuje typowe okno dialogowe (Alert) z dynamiczną zawartością i przyciskami akcji.
 * Jest to komponent opakowujący <Popup> z predefiniowanym układem: 
 * nagłówek, dynamiczna treść ({children}), oraz kontener przycisków 'Zamknij' i 'Zapisz'.
 * @param {AlertProps} props - Właściwości komponentu Alert.
 * @returns {JSX.Element} - Zwraca komponent Popup.
 */
export function Alert({ children, title, isOpen, onClose, onSave }: AlertProps): JSX.Element {
    return (
        <Popup title={title} isOpen={isOpen} onClose={onClose}>
            <div className="alert-message">
                {children} 
            </div>
            <div className="alert-actions">
                {/* Przycisk Zapisz jest renderowany tylko, jeśli onSave zostało przekazane */}
                {onSave && (
                    <SaveButton onClick={onSave}>Zapisz</SaveButton>
                )}
                {/* Przycisk Zamknij zawsze jest renderowany */}
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
    // Przycisk wywołuje funkcję zamknięcia z kontekstu
    return <button onClick={close}>{children}</button>;
};