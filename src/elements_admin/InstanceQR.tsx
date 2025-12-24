/**
* @file Implementuje komponent generujący i wyświetlający komunikat z kodem QR danego egzemplarza
* @author Dawid Filipek
* */
import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";
import Popup from "../../public/custom_components/Popup.tsx";
import "./InstanceQR.css";

/**
 * Interfejs dla właściwości komponentu InstanceQR.
 * * @interface InstanceQRProps
 * @property {number[] | number} instance_id - Identyfikator lub tablica identyfikatorów egzemplarzy, dla których mają zostać wygenerowane kody QR.
 * @property {() => void} [onClose] - Opcjonalna funkcja wywoływana podczas zamykania popupu.
 */
interface InstanceQRProps {
    instance_id: number[] | number;
    onClose?: () => void;
}

/**
 * Komponent wyświetlający okno Popup z wygenerowanymi kodami QR dla egzemplarzy książek.
 * Umożliwia podgląd kodów oraz ich pobranie w formacie PNG (pojedynczo lub zbiorczo).
 * * @component
 * @example
 * return (
 * <InstanceQR instance_id={[123, 124]} onClose={() => console.log('Closed')} />
 * )
 * * @param {InstanceQRProps} props - Właściwości komponentu.
 * @returns {JSX.Element} Element JSX renderujący popup z kodami QR.
 */
export default function InstanceQR({ instance_id, onClose }: InstanceQRProps) {
    /** @type {number[]} Normalizacja identyfikatorów do tablicy */
    const ids = Array.isArray(instance_id) ? instance_id : [instance_id];
    
    /** @type {boolean} Czy wyświetlany jest tylko jeden kod QR */
    const isSingle = ids.length === 1;
    
    /** * Referencje do elementów HTMLCanvasElement, na których generowane są kody QR.
     * Kluczem jest ID egzemplarza.
     */
    const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

    /**
     * Efekt odpowiedzialny za generowanie kodów QR na elementach canvas
     * po zamontowaniu komponentu lub zmianie identyfikatorów.
     */
    useEffect(() => {
        ids.forEach(id => {
            const canvas = canvasRefs.current[id];
            if (canvas) {
                QRCode.toCanvas(canvas, id.toString(), {
                    width: isSingle ? 180 : 110,
                    margin: 1
                }).catch(err => console.error("QR Generation Error:", err));
            }
        });
    }, [ids, isSingle]);

    /**
     * Pobiera wygenerowany kod QR jako plik obrazu PNG.
     * * @param {number} id - Identyfikator egzemplarza, którego kod ma zostać pobrany.
     * @returns {void}
     */
    const downloadQR = (id: number): void => {
        const canvas = canvasRefs.current[id];
        if (!canvas) return;
        
        // Konwersja zawartości canvas na format DataURL (base64 PNG)
        const url = canvas.toDataURL("image/png");
        
        // Tworzenie tymczasowego elementu linku do wywołania pobierania
        const link = document.createElement("a");
        link.download = `QR_Egzemplarz_${id}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={!isSingle ? "qr-standard-list-wrapper" : ""}>
            <Popup
                title={isSingle ? "Kod QR egzemplarza" : "Książka dodana. Kody egzemplarzy:"}
                onClose={onClose}
            >
                {/* Kontener listy kodów z obsługą przewijania */}
                <div className={`qr-scroll-area ${isSingle ? 'single-view' : 'multi-view-list'}`}>
                    {ids.map((id, index) => (
                        <fieldset key={id} className={`qr-card ${isSingle ? 'card-centered' : 'card-horizontal'}`}>
                            {!isSingle && <legend className="qr-card-legend">Egzemplarz #{index + 1}</legend>}
                            
                            <div className={isSingle ? "qr-single-layout" : "qr-horizontal-layout"}>
                                <div className="qr-code-section">
                                    <canvas ref={el => { canvasRefs.current[id] = el; }} />
                                    {isSingle && <p className="qr-id-label">Egzemplarz nr: {id}</p>}
                                </div>

                                {!isSingle && (
                                    <div className="qr-button-section">
                                        <button 
                                            onClick={() => downloadQR(id)} 
                                            className="btn-filled-bordowy btn-side"
                                            title="Pobierz ten kod QR"
                                        >
                                            Zapisz
                                        </button>
                                    </div>
                                )}
                            </div>
                        </fieldset>
                    ))}
                </div>

                {/* Sekcja dolna z akcjami globalnymi */}
                <div className="qr-footer-standard">
                    <button
                        className="btn-outline-bordowy"
                        onClick={() => (Popup as any).currentlyOpen?.close()}
                    >
                        Zamknij
                    </button>

                    <button
                        className="btn-filled-bordowy"
                        onClick={() => isSingle ? downloadQR(ids[0]) : ids.forEach(id => downloadQR(id))}
                    >
                        {isSingle ? "Zapisz do pliku" : "Zapisz wszystkie"}
                    </button>
                </div>
            </Popup>
        </div>
    );
}