/*
* odpowiadający plik w design: 'user/catalog.html'
* widok w design: https://kocham-sggw.ct.ws/biblioteka/Client/catalog.html widoczny obok paska wyszukiwania
* realizowana funkcjonalność:
*   Obsługuje kliknięcie guzika skanowania kodu QR, tego co ma się wyświetlić  i ma zablokować się automatycznie, jeśli użytkownik odpali aplikacje na komputerze
* używane custom komponenty:
*   można użyć <Popup>
*   <CustomTooltip>
 */

import '../assets/qr_code.svg'
import CustomTooltip from "../../public/custom_components/CustomTooltip.tsx";


export default function ScanButton(){
    return <CustomTooltip title="">
        <button type='button'></button>
    </CustomTooltip>
}