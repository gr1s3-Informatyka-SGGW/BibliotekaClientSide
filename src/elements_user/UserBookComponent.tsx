/*
* odpowiadający plik w design: 'navbar.js'
* widok w design: https://kocham-sggw.ct.ws/biblioteka/Client/catalog.html widoczny na liście książek
* realizowana funkcjonalność:
*   wyświetlał informacje o książce na podstawie dany, podanych jako atrybut book_info,
* używane komponenty:
*   <Collapsable> // dopóki nie jest gotowy ma się nie zwijać
 */
import {Component} from "react";

import {type Book} from '../../public/db_types.ts'
import Collapsible from '../../public/custom_components/Collapsible'


class  UserBookComponent extends Component{
    info: Book
    constructor({book_info}:{book_info:Book}) {
        super({});
        this.info = book_info
    }
    render(){
        return <>{this.info.title}</>
    }
    // obsługuje kliknięcie guzika 'Wypożycz'
    rentBook(){

    }
    // obsługuje kliknięcia guzika 'Zarezerwuj'
    reservBook(){

    }

}