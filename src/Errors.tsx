/*
* Strona błędu, wyświetlana w sytuacji, gdy do takiego dojdzie
* Funkcjonalność: ma posiadać komunikat o tym, że strony nie znaleziono i guzik odnoszący do /
* Szczególnym errorem do przygotowania jest error 404, do którego chce mieć jakąś ładną grafikę dodatkowo
* oraz AccessDenied, dla którego już nie trzeba może konkretnej grafiki, ale też ma być osobnym komponentem
* */
import {Navigate} from 'react-router'
import {Component} from 'react';

export default class ErrorComponent extends Component{
    code: number
    message: string
    constructor({code, message}:{code: number, message: string}) {
        super({});
        this.code = code;
        this.message = message;
    }
    render(){
        return <>
            {this.code} - {this.message}
            <button>Powrót</button>
        </>;
    }
}

export class Error404 extends ErrorComponent{
    constructor(){
        super({code: 404, message:"Error 404 :("});
    }
}
export class AccessDeniedError extends ErrorComponent{
    constructor() {
        // sprawdźcie, jaki to error pewnie jakiś 500
        super({code: 500, message:"Strona odmówiła dostepu do podanego linku"});
    }
}