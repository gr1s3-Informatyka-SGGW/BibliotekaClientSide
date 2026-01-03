import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Popup from "../../public/custom_components/Popup.tsx";
import "./InstanceQR.css";

interface InstanceQRProps {
    instance_id: number[] | number;
    onClose?: () => void;
}

export default function InstanceQR({ instance_id, onClose }: InstanceQRProps) {
    const ids = Array.isArray(instance_id) ? instance_id : [instance_id];
    const isSingle = ids.length === 1;
    
    const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
    const [isPopupOpen, setIsPopupOpen] = useState(true);

    const handleClose = () => {
        setIsPopupOpen(false);
        if (onClose) onClose();
    };

    useEffect(() => {
        ids.forEach((id, index) => {
            const canvas = canvasRefs.current[index]; 
            if (canvas) {
                QRCode.toCanvas(canvas, id.toString(), {
                    width: isSingle ? 280 : 160,
                    margin: 2
                }).catch(err => console.error(err));
            }
        });
    }, [ids, isSingle]);

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

        const finalWidth = Math.max(originalCanvas.width, textWidth);
        tempCanvas.width = finalWidth;
        tempCanvas.height = originalCanvas.height + padding;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        ctx.fillStyle = "#801d41";
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(label, tempCanvas.width / 2, 30);

        const qrXOffset = (tempCanvas.width - originalCanvas.width) / 2;
        ctx.drawImage(originalCanvas, qrXOffset, padding);

        const link = document.createElement("a");
        link.download = `QR_Egzemplarz_${id}_${index}.png`;
        link.href = tempCanvas.toDataURL("image/png");
        link.click();
    };

    return (
        <Popup 
            title={isSingle ? "Kod egzemplarza" : "Kody egzemplarzy:"} 
            isOpen={isPopupOpen}
            setIsOpen={(val) => {
                setIsPopupOpen(val);
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