/**
 * @file Implementacja komponentu ScanButton, odpowiadającego za obsługę skanowania kodów QR.
 * @author Karol Jurewicz
 * */

import { useEffect, useRef, useState } from "react";
import Popup from "../../public/custom_components/Popup.tsx";
import CustomTooltip from "../../public/custom_components/CustomTooltip.tsx";

declare function jsQR(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { data: string } | null;

interface ScanButtonProps {
  onScan?: (value: string) => void;
}

/**
 * Komponent ScanButton
 *
 * Wyświetla przycisk skanowania kodu QR.
 * - Na desktopie przycisk jest zablokowany
 * - Na mobile otwiera Popup i uruchamia kamerę
 * - Cała logika skanera jest w tym pliku
 * @prop props
 * @prop {ScanButtonProps} props.onScan funkcja wywołana po pozdyskaniu informacji z kodu QR
 * @returns JSX.Element
 */
const ScanButton = ({ onScan }: ScanButtonProps) => {
  const [isMobile, setIsMobile] = useState(true);
  const [open, setOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanAreaRef = useRef<HTMLDivElement | null>(null);

  const scanningRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

/*
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);
*/

  useEffect(() => {
    if (!open) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const scanArea = scanAreaRef.current;
    const ctx = canvas?.getContext("2d");

    if (!video || !canvas || !scanArea || !ctx) return;

    scanningRef.current = true;

    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      requestAnimationFrame(tick);
    };

    const tick = () => {
      if (!scanningRef.current) return;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const area = scanArea.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();

      const scaleX = canvas.width / videoRect.width;
      const scaleY = canvas.height / videoRect.height;

      const sx = Math.floor((area.left - videoRect.left) * scaleX);
      const sy = Math.floor((area.top - videoRect.top) * scaleY);
      const sw = Math.floor(area.width * scaleX);
      const sh = Math.floor(area.height * scaleY);

      const imageData = ctx.getImageData(sx, sy, sw, sh);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        scanningRef.current = false;
        onScan?.(code.data);
        setOpen(false);
        return;
      }

      requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      scanningRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, onScan]);

  return (
    <>
      <CustomTooltip
        title={
          isMobile
            ? "Skanuj kod QR"
            : "Skanowanie dostępne tylko na urządzeniach mobilnych"
        }
      >
        <button
          type="button"
          disabled={!isMobile}
          onClick={() => isMobile && setOpen(true)}
          className="scan-button"
        >
          📷
        </button>
      </CustomTooltip>

      <Popup title="Skanowanie QR" isOpen={open} setIsOpen={setOpen}>
        <div style={{ position: "relative" }}>
          <video ref={videoRef} playsInline style={{ width: "100%" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div
            ref={scanAreaRef}
            style={{
              position: "absolute",
              inset: "25%",
              border: "2px solid red",
            }}
          />
        </div>
      </Popup>
    </>
  );
};

export default ScanButton;
