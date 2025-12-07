/*
* odpowiadający plik w design: 'collapsible.js'
* przykład w design: https://kocham-sggw.ct.ws/biblioteka/Client/catalog.html "Pokarz szczegóły"
* realizowana funkcjonalność:
*   Chowa swoją zawartość, zostawiając tylko pasek z nagłówkiem o treści `header` ujawnia ją dopiero po naciśnięciu na jego nagłówek
*   Obok nagłówka znajduje się strzałka, która dla zwiniętego elementu wskazuje w prawo <, a dla rozwiniętego w dół v
*/
import './Collapsible.css'
import {type ReactNode, useState} from "react";


function Collapsible({children, header}:{children:ReactNode, header: string}){
    let [isCollapsed, setIsCollapsed] = useState(true)

    return children
}

export default Collapsible