/**
 * @file  Implementuje blok pojedyńczej książki na stronie /catalog administratora. Obsługuje akcje kliknięcia guzików
 * @author Aleksander Grzegrzułka
 * */
import React from "react";
import type {BookAdmin} from "../../public/server_types.ts";

import {editBookRequest, addBookInstanceRequest, removeBookRequest, markDamegedBookInstanceRequest, removeBookInstanceRequest, markMendedBookInstanceRequest } from "../../public/server_requests.ts";
import {CustomSelect, CustomOption} from "../../public/custom_components/CustomSelect.tsx";
import InstanceQR from "./InstanceQR.tsx";

import Collapsible from '../../public/custom_components/Collapsible.tsx'
import {AddBookForm} from "./AddBookView.tsx";
/**
 * Komponent klasowy wyświetlający szczegółowe informacje o książce w widoku administratora.
 * Zawiera nagłówek z tytułem i akcjami oraz zwijaną sekcję ze szczegółami.
 * @extends React.Component
 *
 * @prop props
 * @prop {BookAdmin} props.book_info - Obiekt zawierający szczegółowe informacje o książce.
 * */
export default class AdminBookComponent extends React.Component<{book_info: BookAdmin}, void>{

    render() {
        return <>
        </>
    }
    /**
     * @event addInstance Obsługuje zdarzenie kliknięcia opcji 'Dodaj egzemplarz'
     * @returns {void}
     */
    addInstance(): void{
    }

    /**
     * @event removeBook Obsługuje zdarzenie kliknięcie opcji 'Usuń książkę z systemu'
     * @returns {void}
     */
    removeBook(): void{
    }
    /**
     * @event editBook Obsługuje zdarzenie wybrania opcji 'Edytuj książkę'. Wywołuje komponent <AddBookForm> i wysyła jego wynik do serwera
     * */
    editBook(): void{
    }
}

/**
 * Obiekt prezentujący pojedyńczy egzemplarz znajdujący się na liście egzemplarzy książki
 * @extends React.Component
 *
 * @prop props
 * @prop {number} props.id
 * @prop {"damaged"|"available"|"rented"|"reserved"} props.state - status egzemplarza decydujący o jego dostępności i możliwych akcjach
 * */
class InstanceComponent extends React.Component<{id: number, state: "damaged"|"available"|"rented"|"reserved"},void>{
    render(){
        return <>
        </>
    }
    /**
     * @event markDamaged Obsługuje zdarzenie kliknięcia guzika "Oznacz jako zniszczony". Oznacza egzemplarz jako zniszczony, wysyła żądanie do serwera. Nie dostępny, gdy egzemplarz ma status `damaged`
     * */
    markDamaged(){

    }
    /**
     * @event markMended Obsługuje zdarzenie kliknięcia guzika "Oznacz jako naprawiony". Oznacza egzemplarz jako już nie zniszczony, wysyła żądanie do serwera. Dostępny, tylko gdy egzemplarz ma status 'damaged'
     * */
    markMended(){

    }
    /**
     * @event remove Obsługuje zdarzenie kliknięcia guzika z symbolem kodu QR. Wysyła żądanie usunięcia usuwa egzemplarza
     * */
    remove(){

    }
    /**
     * @event displayQRCode wyświetla komunikat z kodem QR egzemplarza
     * */
    displayQRCode(){
        return <InstanceQR instance_id={this.props.id}/>
    }

}