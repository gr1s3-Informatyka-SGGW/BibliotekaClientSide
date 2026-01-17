/**
 * @file Implementuje komponent generujący i wyświetlający komunikat z kodem QR danego egzemplarza
 * @author Dawid Filipek
 * */
import React, {type Dispatch, useEffect, useRef, useState} from "react";
import QRCode from "qrcode";
import Popup from "../../public/custom_components/Popup.tsx";
import "./InstanceQR.css";
/**
 * Właściwości komponentu InstanceQR.
 * @interface InstanceQRProps
 * @prop {number[] | number} instance_id - Pojedynczy identyfikator lub tablica ID egzemplarzy do wygenerowania kodów.
 * @prop {number} book_id - id książki, do której należy egzemplarz/egzemplarze.
 * @prop isOpen - hook kontrolujący widoczność komponentu
 * @prop setIsOpen - setter dla isOpen
 * @prop {function} [onClose] - Opcjonalna funkcja wywoływana przy zamykaniu komponentu.
 */
interface InstanceQRProps {
    instance_id: number[] | number;
    book_id: number;
    isOpen: boolean
    setIsOpen: Dispatch<React.SetStateAction<boolean>>
    onClose?: () => void;
}

/**
 * Komponent wyświetlający popup z wygenerowanymi kodami QR dla danych egzemplarzy.
 * Pozwala na podgląd oraz pobieranie kodów jako pliki PNG z etykietami.
 * @component
 * @param {InstanceQRProps} props - Właściwości komponentu.
 */
export default function InstanceQR({ instance_id, book_id, isOpen, setIsOpen, onClose }: InstanceQRProps) {
    const ids = Array.isArray(instance_id) ? instance_id : [instance_id];
    const isSingle = ids.length === 1;

    /** Referencje do elementów canvas na, których rysowane są kody QR.
     * @type {React.MutableRefObject<{[key: number]: HTMLCanvasElement | null}>}
     */
    const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});


    /**
     * Obsługuje proces zamykania popupa i wywołuje callback onClose.
     * @function handleClose
     */
    const handleClose = () => {
        setIsOpen(false);
        if (onClose) onClose();
    };

    /**
     * Efekt generujący kody QR na elementach canvas po zamontowaniu komponentu lub zmianie ID.
     */
    useEffect(() => {
        ids.forEach((id, index) => {
            const canvas = canvasRefs.current[index];
            if (canvas) {
                QRCode.toCanvas(canvas, JSON.stringify({instance: id, book: book_id}), {
                    width: isSingle ? 280 : 160,
                    margin: 2
                })
            }
        });
    }, [ids, isSingle]);

    /**
     * Generuje plik obrazu (PNG) zawierający kod QR oraz tekstową etykietę egzemplarza,
     * a następnie inicjuje pobieranie pliku przez przeglądarkę.
     * @function downloadQR
     * @param {number} id - Numer ID egzemplarza.
     * @param {number} index - Indeks egzemplarza w tablicy (używany do odnalezienia odpowiedniego canvas).
     */
    const downloadQR = (id: number, index: number) => {
        const originalCanvas = canvasRefs.current[index];
        if (!originalCanvas) return;

        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) return;

        const fontSize = 20;
        const padding = 50;
        ctx.font = `bold ${fontSize}px Arial`;

        const label = `Egzemplarz #${id}`;
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width + 40;

        // Ustawienie wymiarów nowego płótna (QR + miejsce na tekst)
        const finalWidth = Math.max(originalCanvas.width, textWidth);
        tempCanvas.width = finalWidth;
        tempCanvas.height = originalCanvas.height + padding;

        // Rysowanie tła
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Rysowanie etykiety tekstowej
        ctx.fillStyle = "#801d41";
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(label, tempCanvas.width / 2, 30);

        // Kopiowanie kodu QR na nowe płótno
        const qrXOffset = (tempCanvas.width - originalCanvas.width) / 2;
        ctx.drawImage(originalCanvas, qrXOffset, padding);

        // Wywołanie pobierania
        const link = document.createElement("a");
        link.download = `QR_Egzemplarz_${id}_${index}.png`;
        link.href = tempCanvas.toDataURL("image/png");
        link.click();
    };

    return (
        <Popup
            title={isSingle ? "Kod egzemplarza" : "Kody egzemplarzy:"}
            isOpen={isOpen}
            setIsOpen={(val: boolean) => {
                setIsOpen(val);
                if (!val && onClose) onClose();
            }}
            onClose={handleClose}
        >
            <div className={`qr-popup-content-wrapper ${isSingle ? 'single' : 'multi'}`}>
                <div className="qr-scroll-container">
                    {ids.map((id, index) => (
                        <fieldset key={`${id}-${index}`} className={`qr-instance-fieldset ${isSingle ? 'single-card' : ''}`}>
                            <legend className="qr-instance-legend">
                                Egzemplarz #{id}
                            </legend>
                            <div className="qr-item-row">
                                <div className="qr-code-box">
                                    <canvas ref={(el) => { if (el) canvasRefs.current[index] = el; }} />
                                    {isSingle && <p className="qr-id-text">Egzemplarz nr: {id}</p>}
                                </div>
                                {!isSingle && (
                                    <div className="qr-item-actions">
                                        <button className="btn-pill-bordowy" onClick={() => downloadQR(id, index)}>Zapisz</button>
                                    </div>
                                )}
                            </div>
                        </fieldset>
                    ))}
                </div>

                <div className="qr-popup-footer centered">
                    <button className="btn-pill-outline" onClick={handleClose}>Zamknij</button>
                    {isSingle ? (
                        <>
                            <button className="btn-pill-bordowy" onClick={() => downloadQR(ids[0], 0)}>Zapisz do pliku</button>
                        </>
                    ) : (
                        <>
                            <button className="btn-pill-bordowy" onClick={() => ids.forEach((id, idx) => downloadQR(id, idx))}>
                                Zapisz wszystkie
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Popup>
    );
}