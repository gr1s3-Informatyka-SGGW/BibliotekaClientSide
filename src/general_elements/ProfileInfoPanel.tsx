/**
 * Plik implementujący widok strony
 * @author Natalia Bardadyn
 * */

import React, { Component, type FormEvent } from 'react';
import type { User } from '../../public/server_types.ts';
import accountCircleIcon from '../assets/account_circle.svg';
import Popup from "../../public/custom_components/Popup.tsx";
import { validators } from '../../public/validators.ts';
import CustomTooltip from '../../public/custom_components/CustomTooltip.tsx';

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

/**
 * Komponent panelu profilu użytkownika.
 * Zarządza wyświetlaniem danych, ich edycją oraz zmianą hasła i danych karty.
 * @component
 * @example
 * <ProfileInfoPanel info={userData} />
 * @param {Object} props - Właściwości komponentu.
 * @param {User} props.info - Obiekt zawierający dane zalogowanego użytkownika.
 * @property {Object} state - Stan wewnętrzny komponentu.
 * @property {User} state.user - Aktualne dane użytkownika wyświetlane w profilu.
 * @property {UserFormState} state.formData - Dane tymczasowe przechowywane podczas edycji formularza.
 * @property {Record<string, string>} state.formErrors - Obiekt przechowujący komunikaty błędów walidacji pól formularza.
 * @property {CardFormState} state.cardData - Dane formularza nowej karty płatniczej.
 * @property {boolean} state.isPasswordOpen - Czy popup zmiany hasła jest widoczny.
 * @property {boolean} state.isCardOpen - Czy popup edycji karty jest widoczny.
 */
type AllErrors = { [key in keyof UserFormState | keyof CardFormState | 'password' | 'confirmPassword']?: string };
class ProfileInfoPanel extends Component<{ info: User }, {
    user: User,
    formData: UserFormState,
    formErrors: AllErrors,
    cardData: CardFormState,
    passwordData: {
        oldPass: string,
        newPass: string,
        confirmPass: string
    },
    isPasswordOpen: boolean,
    isCardOpen: boolean,
    showGeneralError: boolean
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
            passwordData: { oldPass: '', newPass: '', confirmPass: '' },
            isPasswordOpen: false,
            isCardOpen: false,
            showGeneralError: false
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
    changeGeneralInfo()/*: React.ReactNode*/ {
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
      * Obsługuje proces zatwierdzania formularza edycji profilu.
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
                user: { ...prevState.user, ...formData },
                showGeneralError: false, // Ukryj błąd ogólny
                formErrors: {}
            }));
            this.editMode = false;
            this.forceUpdate();
        } else {
            // Pokaż błędy w polach (dla tooltipów) i komunikat nad przyciskiem
            this.setState({ formErrors: errors, showGeneralError: true });
        }
    };

    /**
     * Renderuje okno modalne (Popup) do zmiany hasła.
     * @returns {React.ReactNode} Komponent Popup zmiany hasła.
     */
    changePassword(): React.ReactNode {
        const { formErrors, passwordData } = this.state;
        const mainColor = ProfileInfoPanel.mainColor;
        const errorStyle: React.CSSProperties = { color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.2em' };
        const isInvalid = !!formErrors.password || !!formErrors.confirmPassword || !passwordData.oldPass || !passwordData.newPass || !passwordData.confirmPass;

        return (
            <Popup
                title="Zmień hasło"
                isOpen={this.state.isPasswordOpen}
                setIsOpen={(val) => {
                    const newValue = typeof val === 'function' ? val(this.state.isPasswordOpen) : val;
                    this.setState({
                        isPasswordOpen: newValue,
                        formErrors: {},
                        passwordData: { oldPass: '', newPass: '', confirmPass: '' }
                    });
                }}
            >
                <div style={{ minWidth: '300px' }}>
                    <form className="flex-column" style={{ gap: '1em' }} onSubmit={(e) => {
                        e.preventDefault();
                        console.log("Zmiana hasła:", this.state.passwordData);
                        this.setState({ isPasswordOpen: false });
                    }}>

                        <div className="flex-column">
                            <label>Stare hasło:</label>
                            <input
                                type="password"
                                required
                                value={passwordData.oldPass}
                                onChange={(e) => this.setState({
                                    passwordData: { ...passwordData, oldPass: e.target.value }
                                })}
                            />
                        </div>

                        <div className="flex-column">
                            <label>Nowe hasło:</label>
                            <input
                                type="password"
                                required
                                value={passwordData.newPass}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const result = validators.password(val);
                                    this.setState({
                                        passwordData: { ...passwordData, newPass: val },
                                        formErrors: {
                                            ...formErrors,
                                            password: result.ok ? undefined : (result.reason || 'Słabe hasło'),
                                            confirmPassword: val === passwordData.confirmPass ? undefined : 'Hasła nie są identyczne'
                                        }
                                    });
                                }}
                            />
                            {formErrors.password && <span style={errorStyle}>{formErrors.password}</span>}
                        </div>

                        <div className="flex-column">
                            <label>Powtórz nowe hasło:</label>
                            <input
                                type="password"
                                required
                                value={passwordData.confirmPass}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    this.setState({
                                        passwordData: { ...passwordData, confirmPass: val },
                                        formErrors: {
                                            ...formErrors,
                                            confirmPassword: val === passwordData.newPass ? undefined : 'Hasła nie są identyczne'
                                        }
                                    });
                                }}
                            />
                            {formErrors.confirmPassword && <span style={errorStyle}>{formErrors.confirmPassword}</span>}
                        </div>

                        <div className="flex-row responsive-buttons" style={{ gap: '0.5em', marginTop: '1em' }}>
                            <button
                                type="button"
                                className="boring"
                                style={{ flex: 1 }}
                                onClick={() => this.setState({ isPasswordOpen: false, formErrors: {} })}
                            >
                                Odrzuć zmiany
                            </button>
                            <button
                                type="submit"
                                style={{ flex: 1, backgroundColor: mainColor, color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                                Zapisz zmiany
                            </button>
                        </div>
                    </form>
                </div>
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
                <div style={{ minWidth: '300px' }}>
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
                                style={{ flex: 1, backgroundColor: mainColor, color: 'white', border: 'none', cursor: 'pointer' }}
                            >
                                Zapisz zmiany
                            </button>
                        </div>
                    </form>
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
        const isAdmin = (this.props as any).access === 'admin';
        const mainColor = ProfileInfoPanel.mainColor;
        const inputStyle: React.CSSProperties = {
            flex: '0 1 300px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minWidth: '180px'
        };
        const injectInvalidStyle = `
input:invalid { 
    outline: 2px solid #d32f2f !important; 
    border-color: transparent !important; 
    background-color: #fff8f8; 
}

input:valid {
    outline: none !important;
}    
    .profile-data-container {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        margin-bottom: 1.5em;
        -webkit-overflow-scrolling: touch;
        display: flex;
        flex-direction: column;
    }

    .profile-row { 
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important; 
        padding: 0.8em 0 !important;
        min-width: max-content; 
    }

    .profile-label { 
        width: 140px !important; 
        flex-shrink: 0 !important;
        margin-right: 1em;
    }

    .table-input {
        width: 300px !important;
        padding: 6px 8px !important;
        border: 1px solid #ccc !important;
        border-radius: 4px !important;
        font-size: 1em !important;
        margin: 0 !important;
    }
`;
        const labelStyle: React.CSSProperties = { width: '130px', fontWeight: '600', color: mainColor, fontSize: '1.1em', flexShrink: 0 };
        const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center' };
        const valueStyle: React.CSSProperties = { fontSize: '1.1em', color: '#333' };
        const errorStyle: React.CSSProperties = { color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.2em', display: 'block' };
        const isClient = (this.props as any).access !== 'admin';
        return (
            <div className="panel flex-column" style={{ background: 'white', padding: '1.5em', borderRadius: '12px', width: '100%', maxWidth: '325px', margin: '0 auto', boxShadow: '0 2px 15px rgba(0,0,0,0.08)' }}>
                <style>{`
                    input:invalid { border-color: #d32f2f !important; background-color: #fff8f8; }
                    form, .flex-column, .flex-row {
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .profile-data-container {
                        width: 100%;
                        overflow-x: auto;
                        overflow-y: hidden;
                        margin-bottom: 1.5em;
                        -webkit-overflow-scrolling: touch;
                        display: flex;
                        flex-direction: column;
                    }
                    .profile-data-container::-webkit-scrollbar { height: 4px; }
                    .profile-data-container::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
                    .profile-row { 
                        display: flex !important;
                        padding: 0.3em 0 !important;
                        min-width: max-content; 
                    }
                    @media (max-width: 480px) {
                        .responsive-buttons { flex-direction: row !important;  }
                        .full-width-mobile { width: 100% !important; margin-top: 0.5em !important; }
                    }
                `}</style>

                {/* Nagłówek panelu */}
                <div className="flex-row" style={{ alignItems: 'center', gap: '0.8em', marginBottom: '0.5em' }}>
                    <img src={accountCircleIcon} alt="Profile" style={{ height: '1.8em', marginRight: '0.5em', filter: 'invert(18%) sepia(46%) saturate(3453%) hue-rotate(323deg) brightness(91%) contrast(90%)' }} />
                    <h2 style={{ margin: 0, color: mainColor, fontWeight: '500', fontSize: '1.6em' }}>Twój profil</h2>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '0 0 1.5em 0' }} />

                <div className="profile-data-container">
                    {(['name', 'surname', 'email'] as const).map(field => (
                        <div key={field} className="profile-row" style={rowStyle}>
                            <label className="profile-label" style={labelStyle}>
                                {field === 'name' ? 'Imię' : field === 'surname' ? 'Nazwisko' : 'E-mail'}:
                            </label>

                            {this.editMode ? (
                                <div style={{ flex: '0 1 300px', maxWidth: '70%' }}>
                                    <CustomTooltip title={formErrors[field] || ""}>
                                        <input
                                            name={field}
                                            type={field === 'email' ? 'email' : 'text'}
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
                                    </CustomTooltip>
                                </div>
                            ) : (
                                <span className="profile-value" style={valueStyle}>{user[field]}</span>
                            )}
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
                </div>

                <div className="flex-column" style={{ gap: '1em' }}>
                    {this.editMode ? (
                        <>
                            {this.state.showGeneralError && (
                                <span style={{ color: '#d32f2f', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold', marginBottom: '-0.5em' }}>
                                    Nie można zapisać: popraw błędy w polach.
                                </span>
                            )}

                            <div className="flex-row responsive-buttons" style={{ gap: '1.2em' }}>
                                <button type="button" className="boring" onClick={() => this.changeGeneralInfo()} style={{ flex: 1, padding: '0.9em', borderRadius: '8px' }}>
                                    Odrzuć zmiany
                                </button>
                                <button onClick={this.handleGeneralSubmit} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                    Zapisz zmiany
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex-row responsive-buttons" style={{ gap: '1.2em' }}>
                                <button type="button" onClick={() => this.changeGeneralInfo()} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                    Edytuj profil
                                </button>
                                {isClient && user.credit_card_number && (
                                    <button type="button" onClick={() => this.setState({ isCardOpen: true })} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                        Zmień dane karty
                                    </button>
                                )}
                            </div>
                            <button type="button" className="full-width-mobile" onClick={() => this.setState({ isPasswordOpen: true })} style={{ backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '0.5em' }}>
                                Zmień hasło
                            </button>
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
