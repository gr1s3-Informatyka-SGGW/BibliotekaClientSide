/**
 * @file Plik implementuje komponent <Popup> oraz <Alert> wyświetlające komunikaty na środku ekranie
 * i blokujące resztę strony na czas wyświetlania komunikatu.
 * @author Dawid Filipek
 * */
import React, {createContext, type ReactNode, useContext, useState, useEffect, type JSX} from "react";
import { createPortal } from "react-dom";
import './Popup.css';

// ----------------------------------------------------------------------
// KONTEKST I HOOKI
// ----------------------------------------------------------------------

/**
 * Kontekst dostarczający funkcję zamykania modalu ('close')
 * komponentom umieszczonym wewnątrz okna dialogowego.
 * @var {React.Context<() => void>} popupContext
 */
export const popupContext: React.Context<() => void> = createContext(() => {});

/**
 * Hook ułatwiający komponentom potomnym zamknięcie modalu.
 * Umożliwia użycie funkcji zamykającej modal dostarczonej przez kontekst.
 * @returns {() => void} Funkcja zamykająca modal (uzyskana z kontekstu).
 */
export const usePopupClose = () => useContext(popupContext);

// ----------------------------------------------------------------------
// KONTROLOWANY KOMPONENT BAZOWY (_ControlledPopup)
// ----------------------------------------------------------------------

/**
 * @interface ControlledPopupProps
 * Właściwości dla wewnętrznego, kontrolowanego komponentu Popup.
 * @property {ReactNode} children - Zawartość wyświetlana wewnątrz sekcji content.
 * @property {string} [title] - Opcjonalny nagłówek wyświetlany na górze okna.
 * @property {string} [title_icon] - Opcjonalna ścieżka do ikony nagłówka.
 * @property {boolean} isOpen - Stan otwarcia/zamknięcia modalu (KONTROLOWANY Z ZEWNĄTRZ).
 * @property {() => void} onClose - Funkcja wywoływana, gdy modal ma się zamknąć.
 */
interface ControlledPopupProps {
    children: ReactNode;
    title?: string;
    title_icon?: string; 
    isOpen: boolean; 
    onClose: () => void; 
}

/**
 * Wewnętrzny, kontrolowany komponent renderujący okno Popup. 
 * Zawiera logikę Portalu, obsługę tła i klawisza ESC.
 * Dostarcza kontekst zamykania (`popupContext`) całej swojej zawartości.
 * * @param {ControlledPopupProps} props - Właściwości komponentu.
 * @returns {JSX.Element | null} - Zwraca Portal lub null.
 */
function _ControlledPopup({ children, title, title_icon, isOpen, onClose }: ControlledPopupProps): JSX.Element | null {
    
    const close = () => {
        onClose();
    };

    /**
     * Zamyka modal, jeśli kliknięcie nastąpiło dokładnie na tło (backdrop).
     */
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            close();
        }
    };

    /**
     * Efekt nasłuchujący na klawisz Escape w celu zamknięcia.
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
            
            {/* Kontekst obejmuje całe okno, aby wszystkie przyciski miały dostęp do funkcji 'close' */}
            <popupContext.Provider value={close}>
            
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
                        {children}
                    </div>
                    
                </div>
            
            </popupContext.Provider>
            
        </div>,
        document.body
    );
}

// ----------------------------------------------------------------------
// EKSPORT DOMYŚLNY: Popup (Stanowy)
// ----------------------------------------------------------------------

/**
 * @interface StatefulPopupProps
 * Właściwości dla komponentu Popup, który sam zarządza swoim stanem.
 * @property {ReactNode} children - Zawartość wyświetlana wewnątrz sekcji content.
 * @property {string} [title] - Opcjonalny nagłówek.
 * @property {string} [title_icon] - Opcjonalna ścieżka do ikony nagłówka.
 * @property {() => void} [onCloseComplete] - Opcjonalna funkcja wywoływana po całkowitym usunięciu komponentu z DOM. Używana do zresetowania stanu w komponencie nadrzędnym.
 */
interface StatefulPopupProps {
    children: ReactNode;
    title?: string;
    title_icon?: string;
    onCloseComplete?: () => void;
}

/**
 * KOMPONENT Popup: Domyślny eksport.
 * Stanowy wrapper, który używa wewnętrznego `useState` do zarządzania widocznością.
 * Modal jest widoczny natychmiast po zamontowaniu i trwale znika po zamknięciu.
 *
 * @param {StatefulPopupProps} props - Właściwości komponentu.
 * @returns {JSX.Element | null} - Zwraca komponent Popup lub null, gdy zamknięty.
 */
export default function Popup({ children, title, title_icon, onCloseComplete }: StatefulPopupProps): JSX.Element | null {
    
    // Stan wewnętrzny, który kontroluje widoczność modala (domyślnie: otwarty)
    const [isOpen, setIsOpen] = useState(true); 

    /**
     * Wewnętrzna funkcja zamykająca modal. Ustawia stan na false i wywołuje callback dla rodzica.
     */
    const handleClose = () => {
        setIsOpen(false);
        if (onCloseComplete) {
            onCloseComplete();
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <_ControlledPopup
            title={title}
            title_icon={title_icon}
            isOpen={isOpen}
            onClose={handleClose} 
        >
            {children}
        </_ControlledPopup>
    );
}

// ----------------------------------------------------------------------
// KOMPONENT ALERT (STANOWY) I PRZYCISKI
// ----------------------------------------------------------------------

/**
 * @interface AlertProps
 * Właściwości dla komponentu Alert (stanowego).
 * @property {string} message - Treść komunikatu.
 * @property {string} title - Nagłówek okna.
 * @property {() => void} [onSave] - Opcjonalna funkcja wywoływana przy kliknięciu akcji głównej ('Zapisz'/'Tak').
 * @property {string} [cancelButtonText] - Opcjonalny tekst dla przycisku zamknięcia (domyślnie 'Zamknij').
 * @property {string} [saveButtonText] - Opcjonalny tekst dla przycisku akcji głównej (domyślnie 'Zapisz').
 * @property {() => void} [onCloseComplete] - Opcjonalna funkcja wywoływana po trwałym zamknięciu modala.
 */
export interface AlertProps {
    message: string;
    title: string;
    onSave?: () => void;
    cancelButtonText?: string;
    saveButtonText?: string;
    onCloseComplete?: () => void; 
}

/**
 * @interface AlertViewProps
 * Wewnętrzne właściwości dla komponentu renderującego _AlertView, rozszerzające AlertProps o kontrolę stanu.
 */
interface AlertViewProps extends AlertProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * @interface SaveButtonProps
 * Właściwości dla komponentu SaveButton.
 * @property {() => void} onClick - Funkcja do wykonania przed zamknięciem modala.
 * @property {string} text - Tekst przycisku.
 */
interface SaveButtonProps {
    onClick: () => void;
    text: string;
}

/**
 * Pomocniczy komponent do tworzenia przycisków akcji "Zapisz".
 * Wywołuje logikę zapisu, a następnie zamyka modal (używając kontekstu).
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
 * @property {string} text - Tekst przycisku.
 */
interface CloseButtonProps {
    text: string;
}

/**
 * Pomocniczy komponent do tworzenia przycisków, które zamykają modal.
 * Używa hooka usePopupClose, aby uzyskać funkcję zamknięcia z kontekstu.
 */
const CloseButton: React.FC<CloseButtonProps> = ({ text }: CloseButtonProps): JSX.Element => {
    const close = usePopupClose();
    return <button onClick={close}>{text}</button>;
};

/**
 * Wewnętrzny, kontrolowany komponent renderujący Alert. 
 * Zawiera logikę układu (wiadomość + akcje) i renderuje _ControlledPopup.
 * * @param {AlertViewProps} props - Właściwości komponentu.
 * @returns {JSX.Element} - Zwraca _ControlledPopup.
 */
function _AlertView({ message, title, isOpen, onClose, onSave, cancelButtonText, saveButtonText }: AlertViewProps): JSX.Element {
    
    const finalSaveText = saveButtonText || 'Zapisz';
    const finalCancelText = cancelButtonText || 'Zamknij';
    
    return (
        <_ControlledPopup title={title} isOpen={isOpen} onClose={onClose}>
            
            <div className="alert-message">
                {message} 
            </div>
            <div className="alert-actions">
                {onSave && (
                    <SaveButton onClick={onSave} text={finalSaveText} />
                )}
                <CloseButton text={finalCancelText} />
            </div>
            
        </_ControlledPopup>
    );
}


/**
 * Definiuje typowe okno dialogowe (Alert) z prostą treścią tekstową i przyciskami akcji.
 * Komponent ZARZĄDZA WŁASNĄ WIDOCZNOŚCIĄ (`useState(true)`).
 * Używa propa `onCloseComplete` do synchronizacji stanu z rodzicem.
 *
 * @param {AlertProps} props - Właściwości komponentu Alert.
 * @returns {JSX.Element | null} - Zwraca komponent Alert lub null, jeśli zamknięty.
 */
export function Alert({ title, message, onSave, cancelButtonText, saveButtonText, onCloseComplete }: AlertProps): JSX.Element | null {
    
    const [isOpen, setIsOpen] = useState(true); 

    /**
     * Zamyka Alert wewnętrznie i wywołuje zewnętrzny callback, aby zresetować stan rodzica.
     */
    const handleClose = () => {
        setIsOpen(false);
        if (onCloseComplete) {
            onCloseComplete();
        }
    };

    if (!isOpen) {
        return null;
    }

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