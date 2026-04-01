import React, {Component, type JSX, useContext} from 'react';
import errorIcon from '/assets/error.svg';
import "./Errors.css"
import {AuthContext} from "./server/UserAuth.tsx";

/**
 * Bazowy komponent do wyświetlania stron błędów.
 * Prezentuje kod błędu, wiadomość oraz link powrotu do strony głównej.
 *
 * @extends {Component}
 */
export default class ErrorComponent extends Component {
    /**
     * Kod numeryczny błędu (np. 404, 500).
     */
    code: number
    /**
     * Treść komunikatu o błędzie wyświetlana użytkownikowi.
     */
    message: string

    /**
     * Tworzy instancję komponentu błędu.
     * @param {Object} props - Parametry konstruktora.
     * @param {number} props.code - Kod błędu.
     * @param {string} props.message - Wiadomość błędu.
     */
    constructor({ code, message }: { code: number, message: string }) {
        super({code, message});
        this.code = code;
        this.message = message;
    }

    /**
     * Renderuje widok błędu z odpowiednim kodem, komunikatem i ikoną.
     */
    render(): JSX.Element {
        return <>
            <div className='error'>
                <div className='error-code'><p>Błąd {this.code}</p></div>
                <div className='error-message'><p>{this.message}</p><a href='/'>Wróć na stronę główną</a></div>
            </div>
            <img src={errorIcon} alt="" className='error-icon'/>
        </>;
    }
}

/**
 * Specjalny komponent błędu dla kodu 404 (Not Found).
 * Dziedziczy po ErrorComponent i ustawia domyślny komunikat o nieznalezionej stronie.
 *
 * @extends {ErrorComponent}
 */
export class Error404 extends ErrorComponent {
    constructor() {
        super({ code: 404, message: "Strona, której szukasz, nie została znaleziona. Sprawdź, czy adres jest poprawny." });
    }
}

/**
 * Specjalny komponent błędu dla kodu 401 (Access Denied).
 * Dziedziczy po ErrorComponent i ustawia domyślny komunikat o braku uprawnień.
 *
 * @extends {ErrorComponent}
 */
export class AccessDeniedError extends ErrorComponent {
    static contextType = AuthContext;
    declare context: React.ContextType<typeof AuthContext>
    constructor() {
        super({ code: 403, message: "Nie masz uprawnień, aby zobaczyć tę stronę. Spróbuj się zalogować albo skontaktuj się z administratorem, jeśli uważasz, że to pomyłka." });

    }
    render(){
        this.context?.logout();
        return super.render();
    }
}