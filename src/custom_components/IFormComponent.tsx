/**
 * @file Definiuje interface dla komponentów obsługiwanych przez formularze
 * @author Szymon Credo
 * */

/**
 * @interface IFormComponent
 * @template ReturnType typ zwracanych wartości przez komponent
 * @exports
 * */
export default interface IFormComponent<ReturnType> {
    /**
     * Pobiera wartość wpisaną w formularz komponentu
     * @method getValue
     * @return ReturnType
     * */
    getValue: () => ReturnType

}