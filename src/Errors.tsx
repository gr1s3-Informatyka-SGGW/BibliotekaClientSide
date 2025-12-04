/*
* Strona błędu, wyświetlana w sytuacji, gdy do takiego dojdzie
* Funkcjonalność: ma posiadać komunikat o tym, że strony nie znaleziono i guzik odnoszący do /
* Szczególnym errorem do przygotowania jest error 404, do którego chce mieć jakąś ładną grafikę dodatkowo
* oraz AccesDenied, dla którego już nie trzeba może konkretnej grafiki, ale też ma być osobnym komponentem
* */
import { Navigate } from 'react-router'
import { Component } from 'react';
import "./style.css"
import "./errors.css"
import errorIcon from './assets/error.svg';
export default class ErrorComponent extends Component {
    code: number
    message: string
    constructor({ code, message }: { code: number, message: string }) {
        super({});
        this.code = code;
        this.message = message;
    }
    render() {
        return <>
            <div className='error'>
                <div className='error-code'><p>Bład {this.code}</p></div>
                <div className='error-message'><p>{this.message}</p><a href='/'>Wróć na stronę główną</a></div>
            </div>
            <img src={errorIcon} className='error-icon'></img>
        </>;
    }
}

export class Error404 extends ErrorComponent {
    constructor() {
        super({ code: 404, message: "Strona, której szukasz, nie została znaleziona. Sprawdź, czy adres jest poprawny." });
    }
}
export class AccessDeniedError extends ErrorComponent {
    constructor() {
        super({ code: 401, message: "Nie masz uprawnień, aby zobaczyć tę stronę. Spróbuj się zalogować albo skontaktuj się z administratorem, jeśli uważasz, że to pomyłka." });
    }
}