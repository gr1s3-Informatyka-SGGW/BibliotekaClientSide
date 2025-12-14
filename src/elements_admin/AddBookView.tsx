/**
 * @file Plik implementujący możliwość edycji i dodawania nowych książek do systemu.
 * Implementuje stronę /add-book oraz specjalny formularz używany na tej stronie oraz
 * w widoku edycji na stronie /catalog
 * @author
 * */
import {Component, type ReactNode} from "react";

import DynamicSelect from "../../public/custom_components/DynamicSelect.tsx";
import {validators} from "../../public/validators.ts";
import {type Book} from "../../public/server_types.ts";
import type IFormComponent from "../../public/custom_components/IFormComponent.tsx";

/**
 * Pełen widok książki, z paskiem nawigacyjnym i formularzem dodawania książki
 * Obsługuje wysyłanie zapytania do API
 * @returns ReactNode
 * */
export default function AddBookView(){
    return <>AddBookView</>
}
/**
 * @event sendForm
 * Event aktywowany po kliknięciu guzika wysłania formularza,
 * wywołuje funkcje getValues(), aby wysłać dane formularza,
 * dokonuje walidacji i wysyła zapytanie do serwera
 * */
function sendForm(){

}
/**
* Komponent obsługujący formularz dodawania lub edycji książek w systemie.
*  @extends Component
 * @implements IFormComponent<Book>
 *
 * @property {Book|undefined} info - informacje o książce podane przy tworzeniu obiektu w trybie edycji. Komponent automatycznie wypełnia nimi formularz przy renderowaniu
 * @property {'edit'|'create'} mode - sygnalizuje czy formularz jest w trybie edycji, czy dodawania nowej książki
* */
export class AddBookForm extends Component implements IFormComponent<Book>{
    info: Book|undefined
    mode: 'edit'|'create'

    /**
     * @constructor
     * @param {Book|undefined} info - stare dane książki, podawane jedynie przy edycji danych książki
     * */
    constructor(info?: Book) {
        super({})
        this.info = info
        this.mode = info == undefined ? 'create' : 'edit'
    }
    render(){
        return <>

        </>
    }

    /**
     * @implements IFormComponent<Book>
     * Pobiera wartości z formularza
     * @returns Book
     * */
    // @ts-ignore usunąć komentarz po zaimplementowaniu
    getValue(){
        return {}
    }
}
