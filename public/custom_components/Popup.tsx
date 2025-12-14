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
 * @var {React.Context<() => void>} popupContext
 */
export const popupContext: React.Context<() => void> = createContext(() => {});

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
 * Używa React Portals do renderowania się poza drzewem DOM.
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
     * Obsługuje kliknięcie na tło (backdrop).
     * @param {React.MouseEvent<HTMLDivElement>} e - Zdarzenie kliknięcia.
     */
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            close();
        }
    };

    /**
     * Efekt odpowiedzialny za nasłuchiwanie klawisza ESC w celu zamknięcia modala.
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
    }, [isOpen, onClose]);

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
 * Właściwości dla komponentu Alert, który sam zarządza swoją widocznością.
 * @property {string} message - Treść komunikatu (tekst) wyświetlanego w oknie.
 * @property {string} title - Nagłówek okna.
 * @property {() => void} [onSave] - Opcjonalna funkcja wywoływana przy kliknięciu 'Zapisz'. Jeśli nie podana, przycisk się nie wyświetla.
 * @property {string} [cancelButtonText] - Opcjonalny tekst dla przycisku zamknięcia (domyślnie 'Zamknij').
 * @property {string} [saveButtonText] - Opcjonalny tekst dla przycisku zapisu (domyślnie 'Zapisz').
 */
interface AlertProps {
    message: string;
    title: string;
    onSave?: () => void;
    cancelButtonText?: string;
    saveButtonText?: string;
}

/**
 * @interface AlertViewProps
 * Wewnętrzne właściwości dla komponentu renderującego _AlertView, rozszerzające AlertProps 
 * o wymagane przez Popup: isOpen i onClose.
 */
interface AlertViewProps extends AlertProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * @interface SaveButtonProps
 * Właściwości dla komponentu SaveButton.
 */
interface SaveButtonProps {
    onClick: () => void;
    text: string;
}

/**
 * Pomocniczy komponent do tworzenia przycisków akcji "Zapisz".
 * Wywołuje logikę zapisu przekazaną w propsie, a następnie zamyka modal (używając kontekstu).
 * @param {SaveButtonProps} props - Właściwości komponentu.
 * @returns {JSX.Element} - Przycisk HTML z klasą save-button.
 */
const SaveButton: React.FC<SaveButtonProps> = ({ onClick, text }): JSX.Element => {
    const close = usePopupClose();
    
    const handleClick = () => {
        onClick();
        close();
    };
    
    return <button onClick={handleClick} className="save-button">{text}</button>;
};

/**
 * @interface CloseButtonProps
 * Właściwości dla komponentu CloseButton.
 */
interface CloseButtonProps {
    text: string;
}

/**
 * Pomocniczy komponent do tworzenia przycisków, które zamykają modal.
 * Używa hooka usePopupClose, aby uzyskać funkcję zamknięcia z kontekstu.
 * @param {CloseButtonProps} props - Właściwości komponentu.
 * @returns {JSX.Element} - Przycisk HTML.
 */
const CloseButton: React.FC<CloseButtonProps> = ({ text }: CloseButtonProps): JSX.Element => {
    const close = usePopupClose();
    return <button onClick={close}>{text}</button>;
};

/**
 * Wewnętrzny, kontrolowany komponent renderujący Alert. 
 * Zawiera logikę układu (Alert) i renderuje Popup oraz przyciski na podstawie przekazanych propsów.
 * @param {AlertViewProps} props - Właściwości komponentu.
 * @returns {JSX.Element} - Zwraca komponent Popup.
 */
function _AlertView({ message, title, isOpen, onClose, onSave, cancelButtonText, saveButtonText }: AlertViewProps): JSX.Element {
    
    const finalSaveText = saveButtonText || 'Zapisz';
    const finalCancelText = cancelButtonText || 'Zamknij';
    
    return (
        <Popup title={title} isOpen={isOpen} onClose={onClose}>
            <div className="alert-message">
                {message} 
            </div>
            <div className="alert-actions">
                {onSave && (
                    <SaveButton onClick={onSave} text={finalSaveText} />
                )}
                <CloseButton text={finalCancelText} />
            </div>
        </Popup>
    );
}


/**
 * Definiuje typowe okno dialogowe (Alert) z prostą treścią tekstową i przyciskami akcji.
 * Komponent ZARZĄDZA WŁASNĄ WIDOCZNOŚCIĄ (`isOpen` jest wewnętrzne).
 * Jest widoczny natychmiast po zamontowaniu (`useState(true)`) i znika trwale z DOM po zamknięciu (`return null`).
 * Upraszcza użycie, eliminując konieczność przekazywania `isOpen` i `onClose` przez komponent nadrzędny.
 * * @param {AlertProps} props - Właściwości komponentu Alert.
 * @returns {JSX.Element | null} - Zwraca komponent Alert (Popup) lub null, jeśli zamknięty.
 */
export function Alert({ title, message, onSave, cancelButtonText, saveButtonText }: AlertProps): JSX.Element | null {
    
    // Stan wewnętrzny, który kontroluje widoczność modala (domyślnie: otwarty)
    const [isOpen, setIsOpen] = useState(true); 

    /**
     * Wewnętrzna funkcja zamykająca modal. Ustawia stan na false, co powoduje
     * trwałe usunięcie komponentu z drzewa DOM (poprzez `return null`).
     */
    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen) {
        return null;
    }

    // Przekazuje wewnętrzne sterowanie do komponentu renderującego Popup
    return (
        <_AlertView
            title={title}
            message={message}
            isOpen={isOpen}
            onClose={handleClose}
            onSave={onSave}
            cancelButtonText={cancelButtonText}
            saveButtonText={saveButtonText}
        />
    );
}