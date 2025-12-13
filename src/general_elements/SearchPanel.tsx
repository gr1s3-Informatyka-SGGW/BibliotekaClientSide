/**
 * @file Plik implementuje komponent pasku wyszukiwania, obsługujący różne komponenty formularza
 * w celu zapewnienia filtrowania i sortowania wyników.
 * @author
 * */
import {Component, type ReactNode} from "react";
import type IFormComponent from '../../public/custom_components/IFormComponent.tsx'

/**
 * Typ zwracany przez komponent SearchPanel
 * @type SearchPanelReturn
 * @prop {string} search tekst wpisany w pasek wyszukiwania
 *
 * @prop sorting - Niewymagany. Definiuje, w jaki sposób wynik powinien być sortowany
 * @prop {string} sorting.by - atrybut po którym sortowany będzie element
 * @prop {'ASC'|'DSC'} sorting.order - definiuje czy wynik powinien być sortowany rosnąco (ASC) czy malejąco (DSC)
 *
 * @prop filter - Niewymagany. Definiuje, jakie filtry powinny zostać narzucone na wynik wyszukiwania
 * @prop {string} filter.key - klucz filtra, na podstawie jakiego atrybutu zastosowany zostanie filtr
 * @prop {string[]} filter.value - dla tych wartości atrybutu filter.key będzie zdefiniowany
 * */
interface SearchPanelReturn{
    search: string,
    sorting?: {
        by: string,
        order: 'ASC'|'DSC'
    },
    filter?: {
        key: string,
        values: string[]
    }[]
}


/**
 * Główny komponent klasy, pasek wyszukiwania wraz z elementami filtrującymi.
 *
 * @extends Component
 * @implements IFormComponent<SearchPanelReturn> sam jest elementem formularza, zbierającym inne komponenty
 * @exports
 * */
export default class SearchPanel extends Component implements IFormComponent<SearchPanelReturn>{
    /**
     * Konstruktor klasy
     * @constructor
     * @param {object} param
     * @param {IFormComponent[]} param.children - dzieci komponentu, będące elementami formularza filtrujące i sortujące
     * */
    constructor({children}: {children: IFormComponent<object>[]}) {
        super({});

    }
    render() {
        return undefined;
    }
    /**
     * @implements IFormComponent
     * */
    getValue(): SearchPanelReturn{
        return {search: '' }
    }
}
