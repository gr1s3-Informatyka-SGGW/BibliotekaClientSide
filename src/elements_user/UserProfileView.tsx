/*
* plik w design: Client.prile.html
* przykład w design https://kocham-sggw.ct.ws/biblioteka/Client/profile.html
* opis funkcjonalności:
*   obsługuje widok profilu użytkownika, składając do kupy elementy opisane w innych komponentach.
*   Pobiera informacje o użytkowniku a Authcontext
* custom component:
*   <NavSideBar/>
*   <ProfileInfoPanel/>
*   <ProfileBookList/>
* */
import NavSidebar from "../general_elements/NavSidebar.tsx";
import ProfileBookList, {RentComponent, ReservationComponent} from "./ProfileBookList.tsx";
import {AuthContext} from "../../public/UserAuth.tsx";
import {type Session, type Rent, type Reservation} from '../../public/db_types.ts'

import {useContext} from "react";

export default function UserProfileView(){
    let session = useContext(AuthContext)
    return <></>
}
// wpisać w te funkcje przykładową odpowiedź z serwera typu Rent i Reservation
function getRent(){

}
function getRes(){

}
