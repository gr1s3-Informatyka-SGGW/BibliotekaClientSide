/**
 * Plik implemenetujący widok storny
 * */

import React, { Component, type FormEvent, type ChangeEvent } from 'react';
import type { User } from '../../public/server_types.ts';
import accountCircleIcon from '../assets/account_circle.svg';
import Popup from "../../public/custom_components/Popup.tsx";
import { validators } from '../../public/validators.ts';

/**
 * Interfejs opisujący strukturę danych formularza edycji profilu.
 */
interface UserFormState {
    name: string;
    surname: string;
    email: string;
}

/**
 * Interfejs opisujący strukturę danych formularza karty płatniczej.
 */
interface CardFormState {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
}


type AllErrors = { [key in keyof UserFormState | keyof CardFormState | 'password' | 'confirmPassword']?: string };

/**
 * Komponent panelu profilu użytkownika.
 * Zarządza wyświetlaniem danych, ich edycją oraz zmianą hasła i danych karty.
 * @component
 * @example
 * <ProfileInfoPanel info={userData} />
 * @property {Object} props - Właściwości komponentu.
 * @property {User} props.info - Obiekt zawierający dane zalogowanego użytkownika.
 * @property {Object} state - Stan wewnętrzny komponentu.
 * @property {User} state.user - Aktualne dane użytkownika wyświetlane w profilu.
 * @property {UserFormState} state.formData - Dane tymczasowe przechowywane podczas edycji formularza.
 * @property {Record<string, string>} state.formErrors - Obiekt przechowujący komunikaty błędów walidacji pol formularza.
 * @property {CardFormState} state.cardData - Dane formularza nowej karty płatniczej.
 * @property {boolean} state.isPasswordOpen - Czy popup zmiany hasła jest widoczny.
 * @property {boolean} state.isCardOpen - Czy popup edycji karty jest widoczny.
 */
class ProfileInfoPanel extends Component<{ info: User }, {
    user: User,
    formData: UserFormState,
    formErrors: AllErrors,
    cardData: CardFormState,
    isPasswordOpen: boolean,
    isCardOpen: boolean
}> {
    editMode: boolean;
    private static mainColor = '#891E49';

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
     * Sprawdza poprawność imienia, nazwiska oraz adresu email.
     * @param {string} name - Nazwa pola formularza (np. 'email', 'name').
     * @param {string} value - Aktualna wartość pola.
     * @returns {string} Komunikat błędu lub pusty ciąg znaków, jeśli pole jest poprawne.
     */
    private validateField = (name: keyof UserFormState, value: string): string | null => {
        const trimmedValue = value.trim();
        if (!trimmedValue) return 'Pole nie może być puste.';

        const validatorMapping = {
            email: validators.email,
            name: validators.firstName,
            surname: validators.lastName
        };

        const validatorFn = validatorMapping[name];
        const result = validatorFn(trimmedValue);

        return result.ok ? null : (result.reason || 'Niepoprawne dane.');
    };

    /**
     * Waliduje pola formularza karty płatniczej.
     * @param {string} name - Nazwa pola karty (np. 'cardNumber').
     * @param {string} value - Wartość pola.
     * @returns {string} Komunikat błędu walidacji.
     */
    private validateCardField = (name: keyof CardFormState, value: string): string | null => {
        let result;
        switch (name) {
            case 'cardNumber':
                result = validators.cardNum(value);
                break;
            case 'expiryDate':
                result = validators.cardExp(value);
                break;
            case 'cvv':
                result = validators.cvv(value);
                break;
            default:
                return null;
        }
        return result.ok ? null : (result.reason || 'Niepoprawne dane.');
    };

    /**
     * Renderuje sekcję formularza edycji danych ogólnych użytkownika
     * lub widok podglądu, w zależności od trybu edycji (this.editMode).
     * @returns {React.ReactNode} Elementy JSX sekcji danych ogólnych.
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
      * @event handleGeneralSubmit Obsługuje proces zatwierdzania formularza edycji profilu.
      * Przeprowadza walidację wszystkich pól, aktualizuje stan użytkownika
      * i wyłącza tryb edycji w przypadku sukcesu.
      * @param {FormEvent} e - Zdarzenie przesłania formularza.
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
     * Renderuje okno modalne (Popup) do zmiany hasła.
     * @returns {React.ReactNode} Komponent Popup zmiany hasła.
     */
    changePassword(): React.ReactNode {
        const { formErrors } = this.state;
        const mainColor = ProfileInfoPanel.mainColor;
        const errorStyle: React.CSSProperties = { color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.2em' };

        return (
            <Popup
                title="Zmień hasło"
                isOpen={this.state.isPasswordOpen}
                setIsOpen={(val) => {
                    const newValue = typeof val === 'function'
                        ? val(this.state.isPasswordOpen)
                        : val;

                    this.setState({ isPasswordOpen: newValue, formErrors: {} });
                }}
            >
                <form className="flex-column" style={{ gap: '1em' }} onSubmit={(e) => {
                    e.preventDefault();
                    this.setState({ isPasswordOpen: false });
                }}>
                    <div className="flex-column">
                        <label>Nowe hasło:</label>
                        <input
                            type="password"
                            required
                            onChange={(e) => {
                                const val = e.target.value;
                                const result = validators.password(val);
                                this.setState({
                                    formErrors: { ...formErrors, password: result.ok ? undefined : (result.reason || 'Słabe hasło') }
                                });
                            }}
                        />
                        {formErrors.password && <span style={errorStyle}>{formErrors.password}</span>}
                    </div>

                    <div className="flex-row responsive-buttons" style={{ gap: '0.5em', marginTop: '1em' }}>
                        <button type="button" className="boring" style={{ flex: 1 }} onClick={() => this.setState({ isPasswordOpen: false })}>Odrzuć zmiany</button>
                        <button
                            type="submit"
                            disabled={!!formErrors.password}
                            style={{ flex: 1, backgroundColor: mainColor, color: 'white', opacity: formErrors.password ? 0.5 : 1 }}
                        >
                            Zapisz zmiany
                        </button>
                    </div>
                </form>
            </Popup>
        );
    }

    /**
     * Renderuje okno modalne (Popup) do edycji danych karty płatniczej.
     * @returns {React.ReactNode} Komponent Popup edycji karty.
     */
    changeCardInfo(): React.ReactNode {
        const { cardData, formErrors } = this.state;
        const mainColor = ProfileInfoPanel.mainColor;

        const errorStyle: React.CSSProperties = {
            color: '#d32f2f',
            fontSize: '0.75rem',
            marginTop: '0.2em',
            fontWeight: '500'
        };

        return (
            <Popup
                title="Zmień dane karty"
                isOpen={this.state.isCardOpen}
                setIsOpen={(val) => {
                    const newValue = typeof val === 'function'
                        ? val(this.state.isCardOpen)
                        : val;

                    this.setState({ isCardOpen: newValue, formErrors: {} });
                }}
            >
                <form onSubmit={this.handleCardSubmit} className="flex-column" style={{ gap: '1em' }}>
                    <div className="flex-column">
                        <label>Numer karty:</label>
                        <input
                            name="cardNumber"
                            type="text"
                            placeholder="XXXX XXXX XXXX XXXX"
                            value={cardData.cardNumber}
                            style={{ padding: '8px', border: formErrors.cardNumber ? '1px solid red' : '1px solid #ccc' }}
                            onChange={(e) => {
                                const val = e.target.value;
                                this.setState({
                                    cardData: { ...cardData, cardNumber: val },
                                    formErrors: { ...formErrors, cardNumber: this.validateCardField('cardNumber', val) || undefined }
                                });
                            }}
                            required
                        />
                        {formErrors.cardNumber && <span style={errorStyle}>{formErrors.cardNumber}</span>}
                    </div>

                    <div className="flex-row" style={{ gap: '1em' }}>
                        <div className="flex-column" style={{ flex: 1 }}>
                            <label>Data wygaśnięcia:</label>
                            <input
                                name="expiryDate"
                                type="text"
                                placeholder="MM/YY"
                                value={cardData.expiryDate}
                                style={{ padding: '8px', border: formErrors.expiryDate ? '1px solid red' : '1px solid #ccc' }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    this.setState({
                                        cardData: { ...cardData, expiryDate: val },
                                        formErrors: { ...formErrors, expiryDate: this.validateCardField('expiryDate', val) || undefined }
                                    });
                                }}
                                required
                            />
                            {formErrors.expiryDate && <span style={errorStyle}>{formErrors.expiryDate}</span>}
                        </div>

                        <div className="flex-column" style={{ flex: 1 }}>
                            <label>CVV:</label>
                            <input
                                name="cvv"
                                type="text"
                                placeholder="CVV"
                                value={cardData.cvv}
                                style={{ padding: '8px', border: formErrors.cvv ? '1px solid red' : '1px solid #ccc' }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    this.setState({
                                        cardData: { ...cardData, cvv: val },
                                        formErrors: { ...formErrors, cvv: this.validateCardField('cvv', val) || undefined }
                                    });
                                }}
                                required
                            />
                            {formErrors.cvv && <span style={errorStyle}>{formErrors.cvv}</span>}
                        </div>
                    </div>

                    <div className="flex-row responsive-buttons" style={{ gap: '0.5em', marginTop: '1em' }}>
                        <button
                            type="button"
                            className="boring"
                            style={{ flex: 1 }}
                            onClick={() => this.setState({ isCardOpen: false, formErrors: {} })}
                        >
                            Odrzuć zmiany
                        </button>
                        <button
                            type="submit"
                            style={{ flex: 1, backgroundColor: mainColor, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Zapisz zmiany
                        </button>
                    </div>
                </form>
            </Popup>
        );
    }

    /**
     * @event handleCardSubmit Obsługuje wysyłkę formularza danych karty.
     * @param e Zdarzenie formularza.
     */
    handleCardSubmit = (e: FormEvent) => {
        e.preventDefault();
        const { cardData } = this.state;

        const numErr = this.validateCardField('cardNumber', cardData.cardNumber);
        const expErr = this.validateCardField('expiryDate', cardData.expiryDate);
        const cvvErr = this.validateCardField('cvv', cardData.cvv);

        if (numErr || expErr || cvvErr) {
            this.setState({ formErrors: { ...this.state.formErrors, cardNumber: numErr || undefined, expiryDate: expErr || undefined, cvv: cvvErr || undefined } });
            return;
        }

        this.setState(prevState => ({
            user: { ...prevState.user, credit_card_number: prevState.cardData.cardNumber.replace(/\s/g, '') },
            isCardOpen: false,
            cardData: { cardNumber: '', expiryDate: '', cvv: '' },
            formErrors: {}
        }));
    };

    /**
     * Renderuje interfejs użytkownika panelu profilu.
     */
    render() {
        const { user, formData, formErrors } = this.state;
        const mainColor = ProfileInfoPanel.mainColor;
        const inputStyle: React.CSSProperties = {
            flex: 1,
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc'
        };
        const injectInvalidStyle = `
    input:invalid { border-color: #d32f2f !important; background-color: #fff8f8; }
    
    @media (max-width: 480px) {
        .panel { 
            padding: 1.2em !important; 
        }
        .panel h2 { 
            font-size: 1.4em !important; 
        }
        .panel hr { 
            margin: 0 0 0.8em 0 !important; 
        }
        .profile-row { 
            flex-direction: column !important; 
            align-items: flex-start !important; 
            padding: 0.5em 0 !important;
        }
        .profile-label { 
            width: 100% !important; 
            margin-bottom: 0.2em;
            font-size: 0.9em !important;
        }
        .profile-value {
            font-size: 1em !important;
            word-break: break-all;
        }
        .responsive-buttons { 
            flex-direction: column !important; 
            gap: 0.8em !important;
        }
        .responsive-buttons button { 
            width: 100% !important; 
            padding: 0.8em !important;
        }
    }
`;
        const labelStyle: React.CSSProperties = { width: '130px', fontWeight: '600', color: mainColor, fontSize: '1.1em', flexShrink: 0 };
        const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center' };
        const valueStyle: React.CSSProperties = { fontSize: '1.1em', color: '#333' };
        const errorStyle: React.CSSProperties = { color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.2em', display: 'block' };
        const isClient = (this.props as any).access !== 'admin';
        return (
            <div className="panel flex-column" style={{ background: 'white', padding: '1.5em', borderRadius: '12px', width: '95%', maxWidth: '650px', margin: '0 auto', boxShadow: '0 2px 15px rgba(0,0,0,0.08)' }}>
                <style>{injectInvalidStyle}</style>
                <div className="flex-row" style={{ alignItems: 'center', gap: '0.8em', marginBottom: '0.5em' }}>
                    <img src={accountCircleIcon} alt="Profile" style={{ height: '1.8em', marginRight: '0.5em', filter: 'invert(18%) sepia(46%) saturate(3453%) hue-rotate(323deg) brightness(91%) contrast(90%)' }} />
                    <h2 style={{ margin: 0, color: mainColor, fontWeight: '500', fontSize: '1.6em' }}>Twój profil</h2>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '0 0 1.5em 0' }} />

                {this.editMode ? (
                    <form onSubmit={this.handleGeneralSubmit} className="flex-column">
                        {(['name', 'surname', 'email'] as const).map(field => (
                            <div key={field} style={{ marginBottom: '1em' }}>
                                <div className="profile-row" style={rowStyle}>
                                    <label className="profile-label" style={labelStyle}>
                                        {field === 'name' ? 'Imię' : field === 'surname' ? 'Nazwisko' : 'E-mail'}:
                                    </label>
                                    <input
                                        name={field}
                                        type={field === 'email' ? 'email' : 'text'}
                                        required
                                        minLength={field !== 'email' ? 2 : undefined}
                                        value={formData[field]}
                                        style={inputStyle}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            this.setState(p => ({
                                                formData: { ...p.formData, [field]: val },
                                                formErrors: { ...p.formErrors, [field]: this.validateField(field, val) || undefined }
                                            }));
                                        }}
                                    />
                                </div>
                                {formErrors[field] && (
                                    <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginLeft: '5px' }}>{formErrors[field]}</span>
                                )}
                            </div>
                        ))}

                        <div className="flex-row responsive-buttons" style={{ gap: '1.2em', marginTop: '1em' }}>
                            <button type="button" className="boring" onClick={() => this.changeGeneralInfo()} style={{ flex: 1, padding: '0.9em', borderRadius: '8px' }}>
                                Anuluj
                            </button>
                            <button type="submit" style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>
                                Zapisz dane
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        {(['name', 'surname', 'email'] as const).map(field => (
                            <div key={field} className="profile-row" style={rowStyle}>
                                <label className="profile-label" style={labelStyle}>
                                    {field === 'name' ? 'Imię' : field === 'surname' ? 'Nazwisko' : 'E-mail'}:
                                </label>
                                <span className="profile-value" style={valueStyle}>{user[field]}</span>
                            </div>
                        ))}
                        {isClient && user.credit_card_number && (
                            <div className="profile-row" style={rowStyle}>
                                <label className="profile-label" style={labelStyle}>Numer karty:</label>
                                <span className="profile-value" style={valueStyle}>
                                    **** **** **** {user.credit_card_number.slice(-4)}
                                </span>
                            </div>
                        )}

                        <div className="flex-column" style={{ gap: '1em', marginTop: '2em' }}>
                            {isClient ? (
                                <>
                                    <div className="flex-row responsive-buttons" style={{ gap: '1.2em' }}>
                                        <button type="button" onClick={() => this.changeGeneralInfo()} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                            Edytuj profil
                                        </button>
                                        {user.credit_card_number && (
                                            <button type="button" onClick={() => this.setState({ isCardOpen: true })} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                                Zmień dane karty
                                            </button>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => this.setState({ isPasswordOpen: true })} style={{ backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                        Zmień hasło
                                    </button>
                                </>
                            ) : (
                                <div className="flex-row responsive-buttons" style={{ gap: '1.2em', display: 'flex', flexDirection: 'row' }}>
                                    <button type="button" onClick={() => this.changeGeneralInfo()} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer', outline: 'none' }}>
                                        Edytuj profil
                                    </button>
                                    <button type="button" onClick={() => this.setState({ isPasswordOpen: true })} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer', outline: 'none' }}>
                                        Zmień hasło
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {this.state.isPasswordOpen && this.changePassword()}
                {this.state.isCardOpen && this.changeCardInfo()}

            </div>
        );
    }
}

export default ProfileInfoPanel;
