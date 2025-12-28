import React, { Component, FormEvent, ChangeEvent } from 'react';
import type { User } from '../../public/server_types.ts';
import accountCircleIcon from '../assets/account_circle.svg';
import Popup from "../../public/custom_components/Popup.tsx";

interface UserFormState {
    name: string;
    surname: string;
    email: string;
}

interface CardFormState {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
}

/**
 * Komponent panelu profilu użytkownika.
 * Zarządza wyświetlaniem danych, ich edycją oraz zmianą hasła i danych karty.
 */
class ProfileInfoPanel extends Component<{ info: User }, {
    user: User,
    formData: UserFormState,
    formErrors: { [key in keyof UserFormState]?: string },
    cardData: CardFormState,
    isPasswordOpen: boolean,
    isCardOpen: boolean
}> {
    /** Czy komponent jest w trybie edycji danych podstawowych */
    editMode: boolean;
    private mainColor = '#891E49';

    /**
     * @param props Właściwości komponentu zawierające obiekt User.
     */
    constructor(props: { info: User }) {
        super(props);
        this.editMode = false;

        this.state = {
            user: props.info,
            formData: {
                name: props.info.name,
                surname: props.info.surname,
                email: props.info.email,
            },
            formErrors: {},
            cardData: { cardNumber: '', expiryDate: '', cvv: '' },
            isPasswordOpen: false,
            isCardOpen: false
        };
    }

    /**
     * Waliduje pojedyncze pole formularza.
     * @param name Nazwa pola formularza.
     * @param value Wartość do walidacji.
     * @returns Komunikat o błędzie lub null, jeśli pole jest poprawne.
     */
    private validateField = (name: keyof UserFormState, value: string): string | null => {
        if (!value.trim()) return 'Pole nie może być puste.';
        if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Niepoprawny e-mail.';
        if ((name === 'name' || name === 'surname') && value.trim().length < 2) return 'Min. 2 znaki.';
        return null;
    };

    /**
     * Przełącza tryb edycji danych profilowych.
     * W przypadku anulowania przywraca dane do stanu pierwotnego.
     */
    changeGeneralInfo() {
        if (this.editMode) {
            this.setState({
                formData: {
                    name: this.state.user.name,
                    surname: this.state.user.surname,
                    email: this.state.user.email,
                },
                formErrors: {}
            });
        }
        this.editMode = !this.editMode;
        this.forceUpdate();
    }

    /**
     * Obsługuje wysyłkę formularza edycji danych użytkownika.
     * @param e Zdarzenie formularza.
     */
    handleGeneralSubmit = (e: FormEvent) => {
        e.preventDefault();
        const { formData } = this.state;
        const errors: { [key in keyof UserFormState]?: string } = {};
        let isValid = true;

        (Object.keys(formData) as Array<keyof UserFormState>).forEach(key => {
            const error = this.validateField(key, formData[key]);
            if (error) { errors[key] = error; isValid = false; }
        });

        if (isValid) {
            this.setState(prevState => ({
                user: { ...prevState.user, ...formData }
            }));
            this.editMode = false;
            this.forceUpdate();
        } else {
            this.setState({ formErrors: errors });
        }
    };

    /**
     * Zwraca komponent Popup z formularzem zmiany hasła.
     * @returns Element JSX.Element.
     */
    changePassword() {
        return (
            <Popup title="Zmień hasło" isOpen={this.state.isPasswordOpen} setIsOpen={(val) => this.setState({ isPasswordOpen: val })}>
                <label>Stare hasło:</label>
                <input type="password" required />
                <label>Nowe hasło:</label>
                <input type="password" required />
                <label>Powtórz nowe hasło:</label>
                <input type="password" required />
                <div className="flex-row" style={{ gap: '0.5em', marginTop: '1em' }}>
                    <button type="button" className="boring" style={{ flex: 1 }} onClick={() => this.setState({ isPasswordOpen: false })}>Odrzuć zmiany</button>
                    <button type="submit" style={{ flex: 1, backgroundColor: this.mainColor, color: 'white' }}>Zapisz zmiany</button>
                </div>
            </Popup>
        );
    }

    /**
     * Zwraca komponent Popup z formularzem edycji danych karty płatniczej.
     * @returns Element JSX.Element.
     */
    changeCardInfo() {
        const { cardData } = this.state;
        return (
            <Popup title="Zmień dane karty" isOpen={this.state.isCardOpen} setIsOpen={(val) => this.setState({ isCardOpen: val })}>
                <label>Numer karty:</label>
                <input name="cardNumber" type="text" pattern="[0-9\s]{13,19}" placeholder="XXXX XXXX XXXX XXXX" value={cardData.cardNumber}
                    onChange={(e) => this.setState({ cardData: { ...cardData, cardNumber: e.target.value } })} required />
                <div className="flex-row" style={{ gap: '1em' }}>
                    <div className="flex-column" style={{ flex: 1, gap: '0.5em', marginTop: '1em' }}>
                        <label>Data wygaśnięcia:</label>
                        <input name="expiryDate" type="text" placeholder="MM/RR" value={cardData.expiryDate}
                            onChange={(e) => this.setState({ cardData: { ...cardData, expiryDate: e.target.value } })} required />
                    </div>
                    <div className="flex-column" style={{ flex: 1, gap: '0.5em', marginTop: '1em' }}>
                        <label>CVV:</label>
                        <input name="cvv" type="text" placeholder="CVV" value={cardData.cvv}
                            onChange={(e) => this.setState({ cardData: { ...cardData, cvv: e.target.value } })} required />
                    </div>
                </div>
                <div className="flex-row" style={{ gap: '0.5em', marginTop: '1em' }}>
                    <button type="button" className="boring" style={{ flex: 1 }} onClick={() => this.setState({ isCardOpen: false })}>Odrzuć zmiany</button>
                    <button type="submit" style={{ flex: 1, backgroundColor: this.mainColor, color: 'white' }}>Zapisz zmainy</button>
                </div>
            </Popup>
        );
    }

    /**
     * Obsługuje wysyłkę formularza danych karty.
     * @param e Zdarzenie formularza.
     */
    handleCardSubmit = (e: FormEvent) => {
        e.preventDefault();
        this.setState(prevState => ({
            user: { ...prevState.user, credit_card_number: prevState.cardData.cardNumber.replace(/\s/g, '') },
            isCardOpen: false,
            cardData: { cardNumber: '', expiryDate: '', cvv: '' }
        }));
    };

    /**
     * Renderuje interfejs użytkownika panelu profilu.
     */
    render() {
        const { user, formData } = this.state;
        const mainColor = this.mainColor;

        const labelStyle: React.CSSProperties = { width: '130px', fontWeight: '600', color: mainColor, fontSize: '1.1em', flexShrink: 0 };
        const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '0.8em 0' };
        const valueStyle: React.CSSProperties = { fontSize: '1.1em', color: '#333' };

        return (
            <div className="panel flex-column" style={{ background: 'white', padding: '2.5em', borderRadius: '12px', width: '100%', maxWidth: '650px', boxShadow: '0 2px 15px rgba(0,0,0,0.08)' }}>
                <div className="flex-row" style={{ alignItems: 'center', gap: '0.8em', marginBottom: '0.5em' }}>
                    <img src={accountCircleIcon} alt="Profile" style={{ height: '1.8em', marginRight: '0.5em', filter: 'invert(18%) sepia(46%) saturate(3453%) hue-rotate(323deg) brightness(91%) contrast(90%)' }} />
                    <h2 style={{ margin: 0, color: mainColor, fontWeight: '500', fontSize: '1.6em' }}>Twój profil</h2>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '0 0 1.5em 0' }} />

                {(['name', 'surname', 'email'] as const).map(field => (
                    <div key={field} style={rowStyle}>
                        <label style={labelStyle}>{field === 'name' ? 'Imię' : field === 'surname' ? 'Nazwisko' : 'E-mail'}:</label>
                        {this.editMode ? (
                            <input name={field} value={formData[field]} style={{ flex: 1, padding: '8px' }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    this.setState(p => ({
                                        formData: { ...p.formData, [field]: val },
                                        formErrors: { ...p.formErrors, [field]: this.validateField(field, val) || undefined }
                                    }));
                                }} />
                        ) : (
                            <span style={valueStyle}>{user[field]}</span>
                        )}
                    </div>
                ))}

                {user.credit_card_number && (
                    <div style={rowStyle}>
                        <label style={labelStyle}>Nr karty:</label>
                        <span style={valueStyle}>**** **** **** {user.credit_card_number.slice(-4)}</span>
                    </div>
                )}

                <div className="flex-column" style={{ gap: '1em', marginTop: '2em' }}>
                    {this.editMode ? (
                        <div className="flex-row" style={{ gap: '1.2em' }}>
                            <button type="button" className="boring" onClick={() => this.changeGeneralInfo()} style={{ flex: 1, padding: '0.9em', borderRadius: '8px' }}>Anuluj</button>
                            <button type="submit" style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>Zapisz dane</button>
                        </div>
                    ) : (
                        <>
                            <div className="flex-row" style={{ gap: '1.2em' }}>
                                <button type="button" onClick={() => this.changeGeneralInfo()} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none' }}>Edytuj profil</button>
                                {user.credit_card_number && (
                                    <button type="button" onClick={() => this.setState({ isCardOpen: true })} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none' }}>Zmień dane karty</button>
                                )}
                            </div>
                            <button type="button" onClick={() => this.setState({ isPasswordOpen: true })} style={{ backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none' }}>Zmień hasło</button>
                        </>
                    )}
                </div>

                {this.state.isPasswordOpen && this.changePassword()}
                {this.state.isCardOpen && this.changeCardInfo()}
            </div>
        );
    }
}

export default ProfileInfoPanel;