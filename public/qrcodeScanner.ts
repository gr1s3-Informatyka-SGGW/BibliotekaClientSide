declare function jsQR(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { data: string } | null;

const video = document.getElementById("video") as HTMLVideoElement | null;
const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
const resultDiv = document.getElementById("result") as HTMLDivElement | null;
const scanArea = document.getElementById("scan-area") as HTMLDivElement | null;
const startBtn = document.getElementById("start") as HTMLButtonElement | null;
const restartBtn = document.getElementById("restart") as HTMLButtonElement | null;

if (!video || !canvas || !resultDiv || !scanArea || !startBtn || !restartBtn) {
  throw new Error("QR Scanner: Missing required DOM elements");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("QR Scanner: Cannot get canvas 2D context");
}

let streamActive = false;
let scanning = false;

window.onQRScanned = undefined;

async function startCamera(): Promise<void> {
  resultDiv.textContent = "Uruchamianie kamery";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    video.srcObject = stream;
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

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
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
      scanning = false;
      resultDiv.innerHTML = `Odczytano: <b>${code.data}</b>`;
      scanArea.style.borderColor = "lime";

      (window as any).onQRScanned?.(code.data);
    }
  }

  requestAnimationFrame(tick);
}

startBtn.addEventListener("click", startCamera);

restartBtn.addEventListener("click", async () => {
  if (video.srcObject) {
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach((track) => track.stop());
  }

  streamActive = false;
  scanning = false;
  scanArea.style.borderColor = "red";

  await startCamera();
});
