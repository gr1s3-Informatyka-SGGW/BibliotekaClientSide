/**
 * Plik implementujący widok strony
 * @author Natalia Bardadyn, Olimpia Dejko
 * */

import React, {Component, type FormEvent} from 'react';
import type { User } from '../server/server_types.ts';
import accountCircleIcon from '/assets/account_circle.svg';
import Popup from "../custom_components/Popup.tsx";
import { validators } from '../server/validators.ts';
import CustomTooltip from '../custom_components/CustomTooltip.tsx';
import { fetchUserInfoRequest, changeClientCreditCardRequest, changeClientDataRequest, changeClientPasswordRequest } from "../server/server_requests.ts";

import './ProfileInfoPanel.css';

/**
 * Interfejs opisujący strukturę danych formularza edycji profilu.
 */
interface UserFormState{
    name: string;
    surname: string;
    email: string;
}

/**
 * Interfejs opisujący strukturę danych formularza karty płatniczej.
 */
interface CardFormState{
    cardNumber: string;
    expiryDate: string;
    cvv: string;
}
type AllErrors = { [key in keyof UserFormState | keyof CardFormState | 'password' | 'confirmPassword' | 'oldPassword']?: string };

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
 * @property {Record<string, string>} state.formErrors - Obiekt przechowujący komunikaty błędów walidacji pól formularza.
 * @property {CardFormState} state.cardData - Dane formularza nowej karty płatniczej.
 * @property {boolean} state.isPasswordOpen - Czy popup zmiany hasła jest widoczny.
 * @property {boolean} state.isCardOpen - Czy popup edycji karty jest widoczny.
 */

class ProfileInfoPanel extends Component<{ info: User, access?: string }, {
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
    showGeneralError: boolean,
    editMode: boolean
}> {

    private static mainColor = '#891E49';

    /**
     * @param props Właściwości komponentu zawierające obiekt User.
     */
    constructor(props: { info: User, access?: string }) {
        super(props);

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
            showGeneralError: false,
            editMode: false
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
     * Zmienia stan obiektu, umożliwiając edycje lub jej zakończenie z edycją danych
     */
    changeGeneralInfo(): void {
        if (this.state.editMode) {
            this.setState({
                editMode: false,
                formData: {
                    name: this.props.info.name,
                    surname: this.props.info.surname,
                    email: this.props.info.email,
                },
                formErrors: {}
            });
        } else {
            this.setState({ editMode: true });
        }
    }

    /**
      * @event handleGeneralSubmit Obsługuje proces zatwierdzania formularza edycji profilu.
      * Przeprowadza walidację wszystkich pól, aktualizuje stan użytkownika
      * i wyłącza tryb edycji w przypadku sukcesu.
      * @param {FormEvent} e - Zdarzenie przesłania formularza.
      */
    handleGeneralSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const { formData } = this.state;
        const errors: { [key in keyof UserFormState]?: string } = {};
        let isValid = true;

        (Object.keys(formData) as Array<keyof UserFormState>).forEach(key => {
            const error = this.validateField(key, formData[key]);
            if (error) { errors[key] = error; isValid = false; }
        });

        if (isValid) {
            try {
                await changeClientDataRequest(formData.name, formData.surname);

                this.setState(prevState => ({
                    user: { ...prevState.user, ...formData },
                    showGeneralError: false,
                    formErrors: {},
                    editMode: false
                }));
            } catch (err) {
                console.error("Błąd zapisu danych:", err);
                this.setState({ showGeneralError: true });
            }
        } else {
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
        const isInvalid = !!formErrors.password || !!formErrors.confirmPassword || !passwordData.oldPass || !passwordData.newPass || !passwordData.confirmPass;

        return (
            <Popup
                title="Zmień hasło"
                isOpen={this.state.isPasswordOpen}
                setIsOpen={(val: boolean) => {
                    this.setState({
                        isPasswordOpen: val,
                        formErrors: {},
                        passwordData: { oldPass: '', newPass: '', confirmPass: '' }
                    });
                }}
            >
                <div style={{ minWidth: '300px' }}>
                    <form className="flex-column" style={{ gap: '1em' }} onSubmit={async (e) => {
                        e.preventDefault();
                        if (isInvalid) {
                            return;
                        }

                        try {
                            await changeClientPasswordRequest(passwordData.oldPass, passwordData.newPass);
                            this.setState({
                                isPasswordOpen: false,
                                formErrors: {},
                                passwordData: { oldPass: '', newPass: '', confirmPass: ''}
                            });
                        } catch (err) {
                            console.error("Błąd zmiany hasła:", err);
                            this.setState({
                                isPasswordOpen: true,
                                formErrors: {oldPassword: "Nie udało się zmienić hasła. Sprawdź poprawność starego hasła lub spróbuj później."},
                            });
                        }
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
                                style={{ padding: '8px', borderRadius: '0.75em',
                                    border: formErrors.oldPassword ? '1px solid #d32f2f' : '1px solid #ccc',
                                    backgroundColor: formErrors.oldPassword ? '#fff8f8' : 'white',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div className="flex-column">
                            <label htmlFor='password-new'>Nowe hasło:</label>
                            <CustomTooltip title={formErrors.password}>
                                <input
                                    id='password-new'
                                    type="password"
                                    required
                                    value={passwordData.newPass}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '0.75em',
                                        border: formErrors.password ? '1px solid #d32f2f' : '1px solid #ccc',
                                        backgroundColor: formErrors.password ? '#fff8f8' : 'white',
                                        outline: 'none'
                                    }}
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
                            </CustomTooltip>
                        </div>

                        <div className="flex-column">
                            <label htmlFor='password-input'>Powtórz nowe hasło:</label>
                            <CustomTooltip title={formErrors.confirmPassword}>
                            <input
                                id='password-input'
                                type="password"
                                required
                                placeholder=""
                                value={passwordData.confirmPass}
                                style={{
                                    padding: '8px',
                                    borderRadius: '0.75em',
                                    border: formErrors.confirmPassword ? '1px solid #d32f2f' : '1px solid #ccc',
                                    backgroundColor: formErrors.confirmPassword ? '#fff8f8' : 'white',
                                    outline: 'none'
                                }}
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
                            </CustomTooltip>

                        </div>
                        <div className='flex-row'>
                            {formErrors.oldPassword && <span className='errorStyle'>{formErrors.oldPassword}</span>}
                        </div>



                        <div className="flex-row responsive-buttons" style={{ gap: '0.5em', marginTop: '1em' }}>
                            <button type="button" className="boring" style={{ flex: 1 }} onClick={() => this.setState({ isPasswordOpen: false, formErrors: {} })}>
                                Odrzuć zmiany
                            </button>
                            <button
                                type="submit"
                                style={{
                                    flex: 1,
                                    backgroundColor: mainColor,
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    padding: '0.9em'
                                }}
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

        return (
            <Popup
                title="Zmień dane karty"
                isOpen={this.state.isCardOpen}
                setIsOpen={(val: boolean) => {
                    this.setState({ isCardOpen: val, formErrors: {} });
                }}
            >
                <div style={{ minWidth: '300px' }}>
                    <form onSubmit={this.handleCardSubmit} className="flex-column" style={{ gap: '1em' }}>
                        <div className="flex-column">
                            <label htmlFor='cardNumber'>Numer karty:</label>
                            <CustomTooltip title={formErrors.cardNumber}>
                                <input
                                    id='cardNumber'
                                    name="cardNumber"
                                    type="text"
                                    placeholder="XXXX XXXX XXXX XXXX"
                                    value={cardData.cardNumber}
                                    style={{ padding: '8px', width: '100%', borderRadius: '0.75em', border: '1px solid #d32f2f', backgroundColor: '#fff8f8' }}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        this.setState({
                                            cardData: { ...cardData, cardNumber: val },
                                            formErrors: { ...formErrors, cardNumber: this.validateCardField('cardNumber', val) || undefined }
                                        });
                                    }}
                                    required
                                />
                            </CustomTooltip>
                        </div>

                        <div className="flex-row" style={{ gap: '1em' }}>
                            <div className="flex-column" style={{ flex: 1 }}>
                                <label>Data wygaśnięcia:</label>
                                <CustomTooltip title={formErrors.expiryDate}>
                                    <input
                                        name="expiryDate"
                                        type="text"
                                        placeholder="MM/YY"
                                        value={cardData.expiryDate}
                                        style={{ padding: '8px', width: '100%', borderRadius: '0.75em', border: '1px solid #d32f2f', backgroundColor: '#fff8f8' }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            this.setState({
                                                cardData: { ...cardData, expiryDate: val },
                                                formErrors: { ...formErrors, expiryDate: this.validateCardField('expiryDate', val) || undefined }
                                            });
                                        }}
                                        required
                                    />
                                </CustomTooltip>
                            </div>

                            <div className="flex-column" style={{ flex: 1 }}>
                                <label htmlFor='cvv'>CVV:</label>
                                <CustomTooltip title={formErrors.cvv}>
                                    <input
                                        id='cvv'
                                        name="cvv"
                                        type="text"
                                        placeholder="CVV"
                                        value={cardData.cvv}
                                        style={{ padding: '8px', width: '100%', borderRadius: '0.75em', border: '1px solid #d32f2f', backgroundColor: '#fff8f8' }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            this.setState({
                                                cardData: { ...cardData, cvv: val },
                                                formErrors: { ...formErrors, cvv: this.validateCardField('cvv', val) || undefined }
                                            });
                                        }}
                                        required
                                    />
                                </CustomTooltip>
                            </div>
                        </div>

                        <div className="flex-row responsive-buttons" style={{ gap: '0.5em', marginTop: '1em' }}>
                            <button type="button" className="boring" style={{ flex: 1 }} onClick={() => this.setState({ isCardOpen: false, formErrors: {} })}>
                                Odrzuć zmiany
                            </button>
                            <button type="submit" style={{ flex: 1, backgroundColor: ProfileInfoPanel.mainColor, color: 'white', border: 'none', cursor: 'pointer', borderRadius: '8px', padding: '0.9em' }}>
                                Zapisz zmiany
                            </button>
                        </div>
                    </form>
                </div>
            </Popup>
        );
    }

    /**
     * @event handleCardSubmit Obsługuje wysyłkę formularza danych karty.
     * @param e Zdarzenie formularza.
     */
    handleCardSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const { cardData } = this.state;

        const numErr = this.validateCardField('cardNumber', cardData.cardNumber);
        const expErr = this.validateCardField('expiryDate', cardData.expiryDate);
        const cvvErr = this.validateCardField('cvv', cardData.cvv);

        if (numErr || expErr || cvvErr) {
            this.setState({ formErrors: { ...this.state.formErrors, cardNumber: numErr || undefined, expiryDate: expErr || undefined, cvv: cvvErr || undefined } });
            return;
        }

        const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '');

        try {
            // Wywołanie API
            await changeClientCreditCardRequest({
                number: cleanCardNumber,
                cvv: cardData.cvv,
                exp_date: cardData.expiryDate
            });

            // Sukces — aktualizacja widoku
            this.setState(prevState => ({
                user: { ...prevState.user, credit_card_number: cleanCardNumber },
                isCardOpen: false,
                cardData: { cardNumber: '', expiryDate: '', cvv: '' },
                formErrors: {}
            }));
        } catch (err) {
            console.error("Błąd zmiany karty:", err);
            alert("Nie udało się zmienić danych karty.");
        }
    };

    /**
     * Renderuje interfejs użytkownika panelu profilu.
     */
    render() {
        const {user, formData, formErrors, editMode } = this.state;
        const isClient = this.props.access !== 'admin';
        const mainColor = ProfileInfoPanel.mainColor;
        const inputStyle: React.CSSProperties = {
            flex: '0 1 300px',
            padding: '8px',
            borderRadius: '12px',
            border: '1px solid #ccc',
            minWidth: '180px'
        }

        const valueStyle: React.CSSProperties = { fontSize: '1em', color: '#333' };
        return (
<div className="profile-info-component panel" style={{ borderRadius: '12px', maxWidth: '20em', boxShadow: '0 0 0.4em rgba(0, 0, 0, 0.1)' }}>

    <div className="flex-row" style={{ alignItems: 'center', gap: '0.8em', marginBottom: '0em', }}>
        <img src={accountCircleIcon} alt="Profile" style={{ height: '1.8em', marginRight: '0em', filter: 'invert(18%) sepia(46%) saturate(3453%) hue-rotate(323deg) brightness(91%) contrast(90%)' }} />
        <h2 style={{ margin: 0, justifyContent: 'left', fontWeight: 'bold', color: mainColor, fontSize: '1.17em' }}>Twój profil</h2>
    </div>
    <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '0 0 1.5em 0' }} />

    <table className="profile-data-container">
        <tbody>
        {(['name', 'surname', 'email'] as const).map(field => (
            <tr key={field} className="profile-row">
                <td>
                    <label className="profile-label">
                        {field === 'name' ? 'Imię' : field === 'surname' ? 'Nazwisko' : 'E-mail'}:
                    </label>
                </td>

                {editMode && field !== 'email' ? (
                    <td style={{ flex: '0 1 300px', width: '100%'}}>
                        <CustomTooltip title={formErrors[field] || ""}>
                            <input
                                name={field}
                                type='text'
                                value={formData[field]}
                                style={{ ...inputStyle, width: '100%' }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    this.setState(p => ({
                                        formData: { ...p.formData, [field]: val },
                                        formErrors: { ...p.formErrors, [field]: this.validateField(field, val) || undefined }
                                    }));
                                }}
                            />
                        </CustomTooltip>
                    </td>
                ) : (
                    <td className="profile-value" style={valueStyle}>{user[field]}</td>
                )}
            </tr>
        ))}

        {isClient && user.credit_card_number && (
            <tr className="profile-row">
                <td>
                    <label className="profile-label">Numer karty:</label>
                </td>
                <td className="profile-value" style={valueStyle}>
                    **** **** **** {user.credit_card_number.slice(-4)}
                </td>
            </tr>
        )}
        </tbody>
    </table>

    <div className="flex-column" style={{ gap: '1em' }}>
        {editMode ? (
            <>
                {this.state.showGeneralError && <span style={{ color: '#d32f2f', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold', marginTop: '-1.5em', marginBottom: '-0.5em', display: 'block' }}>Nie można zapisać: popraw błędy w polach.</span>}
                <div className="flex-row responsive-buttons" style={{ gap: '1.2em' }}>
                    <button type="button" className="boring" onClick={() => this.changeGeneralInfo()} style={{ flex: 1, padding: '0.9em', borderRadius: '8px' }}>Odrzuć zmiany</button>
                    <button onClick={this.handleGeneralSubmit} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Zapisz zmiany</button>
                </div>
            </>
        ) : (
            <>
                <div className="flex-row responsive-buttons" style={{ gap: '1.2em' }}>
                    <button type="button" onClick={() => this.changeGeneralInfo()} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Edytuj profil</button>
                    <button type="button" onClick={() => this.setState({ isPasswordOpen: true })} style={{ flex: 1, backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Zmień hasło</button>
                </div>
                {isClient && user.credit_card_number && (
                    <button type="button" className="full-width-mobile" onClick={() => this.setState({ isCardOpen: true })} style={{ width: '100%', backgroundColor: mainColor, color: 'white', padding: '0.9em', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '0.2em' }}>Zmień dane karty</button>
                )}
            </>
        )}
    </div>
    {this.changePassword()}
    {this.changeCardInfo()}
</div>
        );
    }
}

export default ProfileInfoPanel;
