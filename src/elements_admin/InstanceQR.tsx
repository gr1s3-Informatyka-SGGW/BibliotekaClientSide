import { useEffect, useState } from "react";
import Popup from "../common/Popup";
import CustomTooltip from "../common/CustomTooltip";

declare global {
  interface Window {
    onQRScanned?: (value: string) => void;
  }
}

interface ScanButtonProps {
  onScan?: (value: string) => void;
}

const ScanButton = ({ onScan }: ScanButtonProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    window.onQRScanned = (value: string) => {
      onScan?.(value);
      setOpen(false);
    };

    return () => {
      window.onQRScanned = undefined;
    };
  }, [onScan]);

  const handleClick = () => {
    if (!isMobile) return;
    setOpen(true);
  };

  return (
    <>
      <CustomTooltip
        text={
          isMobile
            ? "Skanuj kod QR"
            : "Skanowanie dostępne tylko na urządzeniach mobilnych"
        }
      >
        <button
          type="button"
          onClick={handleClick}
          disabled={!isMobile}
          className="scan-button"
          style={{
            opacity: isMobile ? 1 : 0.5,
            cursor: isMobile ? "pointer" : "not-allowed",
          }}
        >
          📷
        </button>
      </CustomTooltip>

      {open && (
        <Popup title="Skanowanie kodu QR" onClose={() => setOpen(false)}>
          <video id="video" playsInline />
          <canvas id="canvas" style={{ display: "none" }} />
          <div id="scan-area" />
          <div id="result" />
          <button id="start" style={{ display: "none" }} />
          <button id="restart" style={{ display: "none" }} />
        </Popup>
      )}
    </>
  );
};

export default ScanButton;
