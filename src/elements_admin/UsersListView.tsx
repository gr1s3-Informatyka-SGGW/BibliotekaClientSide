/**
 * Plik implementujący widok strony /users-view dla administratora. Umożliwiająca zarządzanie i przeglądanie użytkownikami
 * @author Aleksander Grzegrzułka
 * */

import './UsersListView.css'
import type {UserInfo} from "../../public/server_types.ts";
import {removeUserRequest, blockUserRequest, unblockUserRequest, fetchUserListRequest, addAdminRequest} from '../../public/server_requests.ts'
import NavSidebar from "../general_elements/NavSidebar.tsx";
import SearchPanel from "../general_elements/SearchPanel.tsx";
import {CustomSelect} from "../../public/custom_components/CustomSelect.tsx";
import Popup from "../../public/custom_components/Popup.tsx";

import Collapsible from "../../public/custom_components/Collapsible.tsx";
import React from "react";

/**
 * Komponent strony /users-view, przy łądowaniu odczytuje dane z linku przesłane metodą "GET" i wczytuje z nich filtrowanie i sortowanie wyników
 *
 * @requires NavSidebar umożliwiający nawigacje między stronami
 * @requires SearchPanel umożliwiający filtrowanie i sortowanie wyników
 * @requires CustomSelect umożliwiający wybieranie sortowania i filtrowania przez użytkownika
 * @requires fetchUserListRequest pobierający dane użytkowników z bazy danych na podstawie filtrów
 * */
export default function UsersListView(){
    return <>UsersListView</>
}
/**
 * Komponent będący formularzem dodania nowego bibliotekarza
 *
 * @requires Popup
 * @requires addAdminRequest
 * */
function AddAdminForm(){

}
/**
 * Komponent reprezentujący pojedyńczego użytkownika. Zawiera informacje na jego temat łącznie z jego rezerwacjami i wypożyczeniami.
 * Kolor bloku jest zależny od statusu użytkownika: biały dla zwykłych użytkowników (user), czerwony dla bibliotekarzy (admin) i żółty dla zablokowanych użytkowników (blocked)
 * Umożliwia też blokowanie i usuwanie użytkowników z bazy danych, oraz (dla zwykłych użytkowników) przeglądanie ich obecnych wypożyczeń i rezerwacji.
 * @extends React.Component
 * @prop props
 * @prop {UserInfo} props.user_info dane użytkownika
 *
 * @requires removeUserRequest
 * @requires blockUserRequest
 *
 * @requires Collapsible
 * */
class UserComponent extends React.Component<{user_info: UserInfo}, any>{
    render(){
        return <></>
    }
    /**
     * @event removeUser aktywowany po kliknięciu guzika "Usuń Użytkownika"
     * @private
     * */
    private removeUser(){

    }
    /**
     * @event blockUser aktywowany po kliknięciu guzika "Zablokuj Użytkownika"
     * @private
     * */
    private blockUser(){

    }
}