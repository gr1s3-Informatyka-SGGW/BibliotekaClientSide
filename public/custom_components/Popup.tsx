/*
* odpowiadający plik w design: 'popup.js'
* przykład w design: https://kocham-sggw.ct.ws/biblioteka/Client/catalog.html po naciśnięciu "Wyporzycz" lub w skrajnym przypadku
*                    https://kocham-sggw.ct.ws/biblioteka/Employee/catalog.html po naciśnięciu "Pokarz działania" i "Edutyj książkę"
* realizowana funkcjonalność:
*   wyświetlanie zawartości komponentu jako wyskakującego okna na środku ekranu. Reszta treści rozmazuje się w tle do momentu, gdy okno nie zostanie
*   zamknięte przez akcje wewnątrz komponentu albo użytkownik klinie treść poza nim.
*   Można zdefiniować nagłówek komunikatu wyśweitlający się na jego górze, oraz ikonę obok niego, ikona jest wczytywana z zastbów z użyciem import.
* przykład implementacji:
*   <Popup title="Książka" title_icon={logo}>
*       <div>
            Jakiś html może form
*           <Button onclick="close()">Zamknij</Button>
*       </div>
*   </Popup>
*/
import {createContext, type ReactNode, useContext} from "react";

export const popupContext = createContext(()=>{})

export default function Popup({children, title, title_icon}: {children:ReactNode, title?: String, title_icon?: any}){
    var close = () => {} // close functio
    return <popupContext.Provider value={close}>
        {children}
    </popupContext.Provider>
}

// zdefiniować typowe okno "czy jesteś pewien"
export function Alert({message, title}: {message:string, title: string}){
    return <Popup title={title}>
        <div></div>
    </Popup>
}
