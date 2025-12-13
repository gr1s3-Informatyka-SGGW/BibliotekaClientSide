/*
* plik w design: add_book.html
* przykład w design: http://kocham-sggw.ct.ws/biblioteka/Employee/add_book.html Tagi to <DynamicSelectDisplay> a Wydawca to <DynamicSelect> (ma wyglądać jednak działać trochę inaczej)
* funkcjonalność:
*   komponent umożliwia wybrania z listy, opcji na górze znajduje się search bar, który w miarę możliwości podpowiada,
*   jednak gdy nie ma już żadnych dostępnych opcji, dostarcza nową opcję "dodaj [spisany przez użytkownika tekst]" po jej dodaniu tag dodaje się
*   do listy. Komponent może ograniczać, wybór do jednej wyboru lub umożliwić wybór wielu
*
*   komponent DynamicSelectDisplay to konkretnie wyszukiwarka dla tagów i gatunków, obsługuje dodawanie etykiet wybranych tagów.
*
*   Jako argumenty przyjmuje listę tekstów — dotychczasowych tagów czy innych oraz `name` - swoją nazwę
* */

import {Component} from "react";
import type IFormComponent from "./IFormComponent.tsx";


export default class DynamicSelect extends Component implements IFormComponent<string[]|string>{
    options: string[]
    chosen: string[]|string
    allow_multiple: boolean

    constructor({children, allow_multiple}: { children?: string[], allow_multiple?: boolean }) {
        super({})
        this.options = children != undefined ? children : []
        this.allow_multiple = allow_multiple != undefined ? allow_multiple : true // default true
        this.chosen = []
    }

    render() {
        return <>
            <select>
                <option></option>
            </select>
        </>
    }
    getValue():string[]|string{
        return ''
    }
}

export function DynamicSelectDisplay (){
    return <div>
        <DynamicSelect>

        </DynamicSelect>
    </div>
}