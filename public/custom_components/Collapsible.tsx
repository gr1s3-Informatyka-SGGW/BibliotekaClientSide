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
    let [isCollapsed, setIsCollapsed] = useState(true)

    const toggleCollapse = () => {
        setIsCollapsed(prev => !prev)
    }

    return (
        <div className="collapsible-container">
            <div className="collapsible-header" onClick={toggleCollapse}>
                <span className={`collapsible-arrow ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                    {isCollapsed ? '>' : 'v'}
                </span>
                
                <h3 className="collapsible-title">
                    {header}
                </h3>
            </div>

            {!isCollapsed && (
                <div className="collapsible-content">
                    {children}
                </div>
            )}
        </div>
    )
}

export default Collapsible