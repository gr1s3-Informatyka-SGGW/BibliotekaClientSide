/*
* odpowiadający plik w design: 'popup.js'
* realizowana funkcjonalność:
*   wyświetlanie zawartości komponentu jako wyskakującego okna na środku ekranu. Reszta treści rozmazuje się w tle do momentu, gdy okno nie zostanie
*   zamknięte przez akcje wewnątrz komponentu albo użytkownik klinie treść poza nim.
*/
import {createContext, ReactNode, useContext} from "react";

export const popupContext = createContext(()=>{})

function Popup({children}: {children:ReactNode}){
    var close = () => {} // close function
    return <popupContext.Provider value={close}>
        {children}
    </popupContext.Provider>
}
export default Popup