/**
 * @file Implementacja komponentu zwijającego treść
 * @author Dawid Filipek
 * */
import './Collapsible.css'
import React, {type ReactNode, useState} from "react";

/**
 * Komponent Collapsible
 * * Chowa swoją zawartość, pozostawiając jedynie pasek z nagłówkiem. 
 * Zawartość jest ujawniana po kliknięciu nagłówka.
 * Obok nagłówka znajduje się strzałka, która zmienia się z '>' (zwinięty) na 'v' (rozwinięty).
 *
 * @param props - Właściwości komponentu.
 * @param {ReactNode} props.children - Zawartość, która ma być zwijana i rozwijana.
 * @param {string} props.header - Tekst nagłówka widoczny, gdy element jest zwinięty.
 * @returns {JSX.Element} - Zwraca renderowany komponent React.
 *
 */

function Collapsible({children, header}: {children:ReactNode, header: string}): React.JSX.Element{
    /**
     * Stan określający, czy sekcja jest zwinięta (true) czy rozwinięta (false).
     * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
     */
    let [isCollapsed, setIsCollapsed]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useState(true)

    /**
     * @event toggleCollapse Funkcja przełączająca stan zwinięcia/rozwinięcia komponentu.
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
                        toggleCollapse();
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