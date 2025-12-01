/*
* odpowiadający plik w design: 'navbar.js'
* widok w design: https://kocham-sggw.ct.ws/biblioteka/Client/catalog.html widoczny na liście książek
* realizowana funkcjonalność:
*    wyświetlał informacje o książce na podstawie dany, podanych jako atrybut book_info, używa komponentu <Colabsable>
 */
import {type Book} from '../../public/db_types.ts'
import Collapsible from '../../public/custom_components/Collapsible'

export default function UserBookComponent({book_info}:{book_info:Book}){
    return <>{book_info.title}</>
}