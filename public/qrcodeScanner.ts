declare function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number
): { data: string } | null;

// Extend Window interface for TypeScript
declare global {
    interface Window {
        onQRScanned?: (data: string) => void;
    }
}

const video = document.getElementById("video") as HTMLVideoElement | null;
const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
const resultDiv = document.getElementById("result") as HTMLDivElement | null;
const scanArea = document.getElementById("scan-area") as HTMLDivElement | null;
const startBtn = document.getElementById("start") as HTMLButtonElement | null;
const restartBtn = document.getElementById("restart") as HTMLButtonElement | null;

if (!video || !canvas || !resultDiv || !scanArea || !startBtn || !restartBtn) {
    throw new Error("QR Scanner: Missing required DOM elements");
}

const ctx = canvas.getContext("2d", { willReadFrequently: true });
if (!ctx) {
    throw new Error("QR Scanner: Cannot get canvas 2D context");
}

let streamActive = false;
let scanning = false;

window.onQRScanned = undefined;

async function startCamera(): Promise<void> {
    if (!resultDiv || !video || !startBtn || !restartBtn) return;

    resultDiv.textContent = "Uruchamianie kamery";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
        });

        video.srcObject = stream;
        video.setAttribute("playsinline", "true"); // Required for iOS Safari
        await video.play();

        streamActive = true;
        scanning = true;

        resultDiv.textContent = "Czekam na kod";
        startBtn.style.display = "none";
        restartBtn.style.display = "inline-block";

        requestAnimationFrame(tick);
    } catch (err) {
        console.error("Błąd kamery:", err);
        const message =
            err instanceof Error ? err.message : "Nieznany błąd kamery";
        resultDiv.textContent = "Błąd kamery: " + message;
    }
}

function tick(): void {
    if (!streamActive || !scanning) return;
    if (!video || !canvas || !ctx || !resultDiv || !scanArea) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Use video's internal resolution for the canvas
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const videoRect = video.getBoundingClientRect();
        const areaRect = scanArea.getBoundingClientRect();

        // Calculate the scale between the displayed size and actual resolution
        const scaleX = video.videoWidth / videoRect.width;
        const scaleY = video.videoHeight / videoRect.height;

        // Calculate capture area relative to the video resolution
        const sx = Math.max(0, (areaRect.left - videoRect.left) * scaleX);
        const sy = Math.max(0, (areaRect.top - videoRect.top) * scaleY);
        const sw = Math.min(video.videoWidth - sx, areaRect.width * scaleX);
        const sh = Math.min(video.videoHeight - sy, areaRect.height * scaleY);

        if (sw > 10 && sh > 10) {
            const imageData = ctx.getImageData(sx, sy, sw, sh);
            const code = jsQR(imageData.data, imageData.width, imageData.height, );

            if (code) {
                scanning = false;
                resultDiv.innerHTML = `Odczytano: <b>${code.data}</b>`;
                scanArea.style.borderColor = "lime";

                window.onQRScanned?.(code.data);
                return; // Stop the loop on success
            }
        }
    }

    requestAnimationFrame(tick);
}

startBtn.addEventListener("click", startCamera);

restartBtn.addEventListener("click", async () => {
    if (!video || !scanArea) return;

    if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
    }

    streamActive = false;
    scanning = false;
    scanArea.style.borderColor = "red";

    await startCamera();
});