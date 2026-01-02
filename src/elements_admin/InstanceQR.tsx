/**
* @file Implementuje komponent generujący i wyświetlający komunikat z kodem QR danego egzemplarza
* @author Dawid Filipek
* */
import Popup from "../../public/custom_components/Popup.tsx";
import type {Dispatch, SetStateAction} from "react";

/**
 * Komponent generujący i wyświetlający QR code egzemplarza obsługuje opcje pobierania wygenerowana kodu
 * oraz generowania wielu kodów jednocześnie
 * @prop props
 * @prop {number[]|number} props.instance_id - id egzemplarza lub egzemplarzy, dla których zostanie wygenerowany kod
 * @returns JSX.Element
 */
export default function InstanceQR({instance_id, isOpen, setIsOpen}: {instance_id: number[]|number, isOpen: boolean, setIsOpen: Dispatch<SetStateAction<boolean>>}){
    return <Popup title='QR' isOpen={isOpen} setIsOpen={setIsOpen}>
        <></>
    </Popup>
}