/*
* odpowiadający plik w design: 'catalog.html' opcje sortowania
* widok w design:
* realizowana funkcjonalność:
*   Wyświetla podobny do select, ale ładny.
*   Po naciśnięciu na element rozwija się lista pod nim nad pozostałymi elementami przedstawiająca dostępne opcje.
*   Po wybraniu opcji wyświetla ją mniejszym drukiem pod swoją etykietą.
*   Opcje do wyboru dla użytkownika są przekazywane do elementu pod postacią:
*   Ma posiadać atrybut 'allow_multiple' domyślnie ustawiony na false, który definiuje czy można wybrać wiele opcji
*   Musi przejmować focus tabulatora.
*
*   Posiada też wariant SearchableSelect, który dodatkowo posiada na górze pasek wyszukiwania i na bieżąco filtruje dostępne opcje, aż użytkownik znajdzie to, czego szuka.
*   Design nie implementuje ostatecznego wyglądu tej wersji komponentu, funkcjonalnie ma działać tak samo, jak opcja wyboru tagów, ale wyglądać, jak opcja wyboru sortowania
*
*   Przykład wywołania:
*   <CustomSelect>
*       <CustomOption value="1">Option 1</CustomOption>
*       <CustomOption value="2">Option 2</CustomOption>
*   </CustomSelect>
*/

import {Component} from "react";
import type IFormComponent from "./IFormComponent.tsx";


// Pojedyńcza opcja
export class CustomOption extends Component{
    display_value: string
    passed_value: string|number
    name: string
    constructor(props:{children: string, value: string|number, name: string}) {
        super(props);
        this.display_value = props.children
        this.passed_value = props.value
        this.name = props.name
    }
    render(){
        return <>{this.display_value}</>
    }

}

// to jest zwykły select
export class CustomSelect extends Component implements IFormComponent<string|number>{
    options: CustomOption[]
    allow_multiple: boolean
    constructor(props: {children: CustomOption[], allow_multiple: boolean}) {
        super(props);
        this.options = props.children
        this.allow_multiple = props.allow_multiple
    }

    render() {
        return <>
            {this.options}
        </>;
    }
    getValue(): string|number{
        return ""
    }
}
// ten może jeszcze sortować
export class SearchableSelect extends CustomSelect{
    render(){
        return super.render();
    }
}
