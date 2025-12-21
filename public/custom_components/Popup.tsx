/**
 * @file Implementacja stanowych komponentów <Popup> i <Alert>.
 * @author Dawid Filipek
 */
import React, { createContext, type ReactNode, useContext, useState, useEffect, type JSX } from "react";
import { createPortal } from "react-dom";
import './Popup.css';

// --- Kontekst ---
export const popupContext: React.Context<() => void> = createContext(() => {});
export const usePopupClose = () => useContext(popupContext);

// --- Interfejsy ---

export interface PopupProps {
    title: string;
    icon?: string;
    children: ReactNode;
    onClose?: () => void;
}

/**
 * @interface AlertProps
 * @property {onCancel} - Zmieniono nazwę z onClose. Wywoływane przy rezygnacji/zamknięciu.
 * @property {onAccept} - Wywoływane przy akceptacji. NIE zamyka już automatycznie komponentu.
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

// --- Komponent Pomocniczy ---

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
                        {icon && icon.trim() !== "" && <img src={icon} alt="" className="popup-icon" />}
                        <h3 className="popup-title">{title}</h3>
                    </div>
                    <div className="popup-content">{children}</div>
                </div>
            </popupContext.Provider>
        </div>,
        document.body
    ); 
}

// --- Główne Komponenty ---

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
 * Komponent Alert z nową logiką onAccept / onCancel.
 */
export function Alert({ 
    title, message, icon, onCancel, onAccept, 
    acceptText = "Tak", cancelText = "Ok" 
}: AlertProps): JSX.Element | null {
    const [isOpen, setIsOpen] = useState(true);

    /**
     * Wewnętrzna funkcja zamykająca modal.
     */
    const closeInternal = () => {
        setIsOpen(false);
    };

    /**
     * Obsługa przycisku Anuluj / Zamknij (Ok).
     * Zamyka modal i informuje rodzica.
     */
    const handleCancel = () => {
        closeInternal();
        if (onCancel) onCancel();
    };

    /**
     * Obsługa przycisku Akceptuj.
     * Wykonuje tylko przekazaną akcję. Komponent NIE zamyka się sam.
     */
    const handleAcceptClick = () => {
        if (onAccept) onAccept();
    };

    return (
        <_BaseModal title={title} icon={icon} isOpen={isOpen} handleClose={handleCancel}>
            <div className="alert-message">{message}</div>
            <div className="alert-actions">
                {onAccept && (
                    <button onClick={handleAcceptClick} className="save-button">{acceptText}</button>
                )}
                {/* Przycisk onCancel jest teraz zawsze po prawej stronie */}
                <button onClick={handleCancel} className="cancel-button">{cancelText}</button>
            </div>
        </_BaseModal>
    );
}