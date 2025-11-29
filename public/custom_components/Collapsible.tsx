/*
* odpowiadający plik w design: 'collapsible.js'
* realizowana funkcjonalność:
*   Chowa swoją zawartość, zostawiając tylko pasek z nagłówkiem o treści `header` ujawnia ją dopiero po naciśnięciu na jego nagłówek
*   Obok nagłówka znajduje się strzałka, która dla zwiniętego elementu wskazuje w prawo <, a dla rozwiniętego w dół v
*/
import 'Collapsible.css'
import {ReactNode} from "react";

function Collapsible({children, header}:{children:ReactNode, header: string}){
    return children
}

export default Collapsible