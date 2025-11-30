/*
* odpowiadający plik w design: 'navbar.js'
* widok w design: np: https://kocham-sggw.ct.ws/biblioteka/Client/catalog.html oraz https://kocham-sggw.ct.ws/biblioteka/Employee/catalog.html
* realizowana funkcjonalność:
*   Boczny element nawigacyjny aplikacji. Posiada logo (logo.svg), które odświeża stronę po kliknięciu.
*   Niżej znajduje się widget z informacjami użytkownika oraz listą dostępnych stron w zależności od tego, czy zalogowany jest to user, czy admin
*   Na samym dole znajduje się odnośnik do strony 'O bibliotece' i do wylogowywania się (obsługiwany przez AuthContext logout())
*   W widoku mobilnym ładnie się zwija i dodaje sobie guzik zamknięcia.
*/
import {useContext} from "react";
import {Navigate} from "react-router-dom";

// assets and stylesheet
import 'sidebar.css'
import 'logo.svg'

// login info
import {AuthContext} from '../../public/UserAuth.tsx'

function NavSidebar(){
    let user = useContext(AuthContext)
    return <></>
}
export default NavSidebar