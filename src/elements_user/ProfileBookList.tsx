/*
* plik w design: Client/profile.html
* przykład w design: https://kocham-sggw.ct.ws/biblioteka/Client/profile.html dwie listy znajdujące się po prawej stronie widoku, są dwoma osobnymi obiektami
* typu <ProfileBookList>
* funkcjonalność:
*   element wyświetla w liście informacje na temat książek wypożyczonych i zarezerwowanych, przez użytkownika informacje na temat tych wypożyczeń są w elementach
*   ReservationComponent i RentComponent, które są bardzo podobne, ale mają inne akcje, co zaważyło nad podzieleniem ich, ale jak wola możecie użyć dziedziczenia.
*   Teoretycznie naciśnięcie powinno przenosić do katalogu, aby obejrzeć informacje o książce, zamiast tego zrobimy jakiś popup, gdy ten będzie już napisany
*
*   ReservationComponent, wyświetla czas do upłynięcia rezerwacji, lub 'oczekuje na dostępność'
*   RentComponent, wyświetla termin zwrotu książki, który podświetla na czerwono, gdy termin upłynął i wyświetla obok informacje o naliczonej opłacie i prośbą o zwrócenie książki.
* przykład implementacji:
*   <ProfileBookList header="Lista rezerwacji" icon={logo.svg}>
*       <ReservationComponent info={}/>
*       <ReservationComponent info={}/>
*       <ReservationComponent info={}/>
*   </ProfileBookList>
* używane custom komponenty:
*   <ScanButton>
*   <Popup>
* */
import '../assets/book_ribbon.svg'
import '../assets/book.svg'
import {Component} from "react";

import {type Rent, type Reservation} from "../../public/db_types.ts";
import ScanButton from "./ScanButton.tsx";

export default function ProfileBookList({children, header, icon}:{children: ReservationComponent[]|RentComponent[], header: string, icon: ImageBitmap}) {
    return <></>

}

export class ReservationComponent extends Component{
    info: Reservation
    constructor({info}: {info:Reservation}) {
        super({});
        this.info = info
    }
    render(){
        return <></>
    }
    // obsługuje guzik "Anuluj Rezerwacje"
    canselReservation(){

    }
    // obsługuje guzik "Odbierz"
    withdrawBook(){

    }
}
export class RentComponent extends Component {
    info: Rent
    constructor({info}: {info:Rent}) {
        super({});
        this.info = info
    }
    render(){
        return <></>
    }
}