/*
* plik w design: Client/profile.html oraz Employee/profile.html
* przykład w design: http://kocham-sggw.ct.ws/biblioteka/Employee/profile.html?i=1, oraz http://kocham-sggw.ct.ws/biblioteka/User/profile.html?i=1
* funkcjonalność:
*   Wyświetla dane użytkownika przekazane jako User object, umożliwia zmienianie danych.
*   Po kliknięciu guzika "Edytuj Profil" podmienia wyświetlane dane na <input> i guziki na "Zapisz zmiany" i "Anuluj",
*   które umożliwiają wysłanie nowych danych do API oraz powrót do wcześniejszego widoku.
*   W wersji dla użytkownika możliwa jest też zmiana danych karty płątniczej w oknie popup.
*   Formularze mają korzystać z odpowiednich technik walidacji
* Używane komponenty:
*   <Popup>
*
* */

import {Component, useState} from "react";

import type { User} from "../../public/server_types.ts";

// import {} from '../../public/validators.ts' // poczekaj, aż zostanie przerobiony na typescript przez team regex
import Popup from "../../public/custom_components/Popup.tsx";

class ProfileInfoPanel extends Component{
    editMode: boolean
    constructor({info}:{info: User}) {
        super({});
        this.editMode = false
    }
    render(){
        return <div></div>
    }
    // akcja guzika "EdytujProfil", zmiana komponentu, aby umożliwiaj edycje danych
    changeGeneralInfo(){

    }
    // akcja guzika "Zmień Hasło", wyświetla formularz zmiany hasła
    changePassword(){
        return <Popup title={"Zmień Hasło"}>
            <></>
        </Popup>
    }
    // akcja guzika "Zmień dane karty", wyświetla formularz zmiany danych karty
    changeCardInfo(){
        return <Popup title={"Zmień dane karty"}>
            <></>
        </Popup>
    }
}