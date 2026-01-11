import { useEffect, useRef } from "react";
import jsQR from "jsqr";

interface QRScannerProps {
  onScan: (value: string) => void;
}

const QRScanner = ({ onScan }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef(true);

  useEffect(() => {
    let stream: MediaStream;

    const startCamera = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      if (!videoRef.current || !canvasRef.current || !scanningRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        scanningRef.current = false;
        onScan(code.data);
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      requestAnimationFrame(tick);
    };

    startCamera();

    return () => {
      scanningRef.current = false;
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [onScan]);

  return (
    <div>
      <video ref={videoRef} style={{ width: "100%" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <p>Skanuj kod QR…</p>
    </div>
  );
};

export default QRScanner;
