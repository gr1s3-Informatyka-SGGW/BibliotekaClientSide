/*
* odpowiadający plik w design: 'tooltip.js'
* przykład w design: https://kocham-sggw.ct.ws/biblioteka/Client/profile.html po najechaniu na nazwę książki
* realizowana funkcjonalność:
*   po najechaniu na ten obiekt (jego zawartość) wyświetla obok ładny komunikat sprecyzowany w argumencie `title`
* przykład implementacji:
*   <CustomTooltip title="tekst">
*        <div>Jakiś HTML</div>
*   </CustomTooltip>
*/

import {type ReactNode} from "react";
function CustomTooltip({children, title}: {children: ReactNode, title: string}){
    return children
}
export default CustomTooltip
