import React, { type ReactNode } from "react";
import { createPortal } from "react-dom";
import './Popup.css';

export interface PopupProps {
    title: string;
    icon?: string;
    children: ReactNode;
    onClose?: () => void;
}

interface PopupState {
    isOpen: boolean;
}

export default class Popup extends React.Component<PopupProps, PopupState> {
    static currentlyOpen: Popup | null = null;

    constructor(props: PopupProps) {
        super(props);
        this.state = { isOpen: true };
    }

    public close = () => {
        // Logowanie stanu dla debugowania
        console.log("Zamykanie popupu, obecny stan isOpen:", this.state.isOpen);
        
        if (!this.state.isOpen) return;

        this.setState({ isOpen: false }, () => {
            if (this.props.onClose) this.props.onClose();
            if (Popup.currentlyOpen === this) Popup.currentlyOpen = null;
        });
    };

    componentDidMount() {
        // Zamykamy poprzednie okno dopiero po zamontowaniu nowego
        if (Popup.currentlyOpen && Popup.currentlyOpen !== this) {
            Popup.currentlyOpen.close();
        }
        Popup.currentlyOpen = this;
        document.addEventListener('keydown', this.handleEscape);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleEscape);
        if (Popup.currentlyOpen === this) Popup.currentlyOpen = null;
    }

    private handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.close();
    };

    render() {
        if (!this.state.isOpen) return null;
        const { title, icon, children } = this.props;

        return createPortal(
            <div className="popup-backdrop" onClick={(e) => e.target === e.currentTarget && this.close()}>
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