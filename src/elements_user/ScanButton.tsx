/*
* odpowiadający plik w design: 'user/catalog.html'
* widok w design: https://kocham-sggw.ct.ws/biblioteka/Client/catalog.html widoczny obok paska wyszukiwania
*                 http://kocham-sggw.ct.ws/biblioteka/Client/profile.html guzik odbioru książek
* realizowana funkcjonalność:
*   Obsługuje kliknięcie guzika skanowania kodu QR, tego co ma się wyświetlić  i ma zablokować się automatycznie, jeśli użytkownik odpali aplikacje na komputerze
*   Komponent przyjmuje do swojego środka opcjonalnie tekst guzika, oraz funkcję, do której przekazany zostanie wynik skanowania
* używane custom komponenty:
*   można użyć <Popup>
*   <CustomTooltip>
 */

import '../assets/qr_code.svg'
import CustomTooltip from "../../public/custom_components/CustomTooltip.tsx";
import type {ReactNode} from "react";


export default function ScanButton({children, pass_output}: {children?: string, pass_output: (value:string)=>void}) {

    return <CustomTooltip title="">
        <button type='button'>{children}</button>
    </CustomTooltip>
}