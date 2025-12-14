/**
 * @file Implementacja komponentu zwijającego treść
 * @author Dawid Filipek
 * */
import './Collapsible.css'
import {type ReactNode, useState} from "react";

/**
 * @typedef {object} CollapsibleProps
 * @property {ReactNode} children - Zawartość, która ma być zwijana i rozwijana.
 * @property {string} header - Tekst nagłówka widoczny, gdy element jest zwinięty.
 */
/**
 * Komponent Collapsible
 * * Chowa swoją zawartość, pozostawiając jedynie pasek z nagłówkiem. 
 * Zawartość jest ujawniana po kliknięciu nagłówka.
 * Obok nagłówka znajduje się strzałka, która zmienia się z '>' (zwinięty) na 'v' (rozwinięty).
 *
 * @param {CollapsibleProps} props - Właściwości komponentu.
 * @returns {JSX.Element} - Zwraca renderowany komponent React.
 */

function Collapsible({children, header}: {children:ReactNode, header: string}){
    /**
     * Stan określający, czy sekcja jest zwinięta (true) czy rozwinięta (false).
     * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
     */
    let [isCollapsed, setIsCollapsed] = useState(true)

    /**
     * Funkcja przełączająca stan zwinięcia/rozwinięcia komponentu.
     * Wywoływana po kliknięciu nagłówka.
     */
    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev)
    }

    return (
        <div className="collapsible-container">
            <div 
                className="collapsible-header" 
                onClick={toggleCollapse}
                tabIndex={0} 
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                    }
                }}
            >
                
                <h3 className="collapsible-title">
                    {header}
                </h3>

                <div className={`collapsible-arrow-svg ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                    
                    <svg 
                        className="collapsible-icon" 
                        viewBox="0 0 100 100"
                    >
                        <polygon points="10,10 90,50 10,90"/> 
                    </svg>

                </div>
                
            </div>

            <div className={`collapsible-content ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                {children}
            </div>
        </div>
    )
}

export default Collapsible