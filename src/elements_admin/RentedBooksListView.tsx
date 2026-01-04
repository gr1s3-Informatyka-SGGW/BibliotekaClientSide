/**
 * Plik implementujący widok strony /rented-books dla administratora. Umożliwiająca zarządzanie i przeglądanie wypożyczeń, przy łądowaniu odczytuje dane z linku przesłane metodą "GET" i wczytuje z nich filtrowanie i sortowanie wyników
 * @author Karol Dziuba
 *
 * @requires NavSidebar aby umożliwić nawigacje
 * @requires SearchPanel obsługujący sortowanie wyników
 * @requires CustomSelect umożliwiający ustawiać filtry i sortowania wyników
 * @requires CustomTooltip wyświetla szczegóły książki i użytkownika po najechaniu na informacje o nich
 *
 * @requires extendRentRequest przedłuża czas wypożyczenia książki
 * @requires fetchRentLog pobiera informacje o wypożyczeniach do wyświetlenia
 * */

import type {Book, UserInfo, RentFullInfo} from "../../public/server_types.ts";
import {extendRentRequest, fetchRentLog} from "../../public/server_requests.ts";
import CustomTooltip from "../../public/custom_components/CustomTooltip.tsx";
import React from "react";
import NavSidebar from "../general_elements/NavSidebar.tsx";
import SearchPanel from "../general_elements/SearchPanel.tsx";
import {CustomSelect} from "../../public/custom_components/CustomSelect.tsx";

/**
 * Komponent widoku /rented-books

 * @returns React.JSX.Element
 * */
export default function RentedBooksListView(){
    return <>
        <NavSidebar/>
        <div>
            <SearchPanel>
                <CustomSelect label='' filterKey=''>

                </CustomSelect>
            </SearchPanel>
            <>RentedBooksListView</>
        </div>

    </>

}
/**
 * Komponent, który prezentuje jeden wpis dotyczący wypożyczenia książki.
 * Na podstawie terminu zwrotu i obecnej daty komponent ustala status wypożyczenia: Aktywne (przed terminem zwrotu), Przeterminowane (po terminie, dla którego naliczona jest opłata) i Archiwalne (książka zostałą zwrócona).
 * Dla Aktywnych wypożyczeń komponent umozliwia przedłużenie wypożyczenia (przez guzik "Przedłóż Wypożyczenie")
 * Dla Przeterminowanych informuje o naliczonej opłacie.
 * @prop props
 * @prop {RentFullInfo} props.rent_info - dane książki
 * */
class RentedBookComponent extends React.Component<{ rent_info: RentFullInfo }, any> {
    render() {
        return (<>
            Rent Book Component
        </>)
    }
    /**
     * @event extendRent wywoływany przez kliknięcie guzika "Przedłóż wypożyczenie" wysyła prośbę o przedłużenie wypożyczenia na serwer z użyciem funkcji extendRentRequest
     * @private
     * */
    private extendRent(){

    }
}