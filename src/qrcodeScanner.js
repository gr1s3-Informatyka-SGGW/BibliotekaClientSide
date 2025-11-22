// jsQr Library


const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const resultDiv = document.getElementById("result");
const scanArea = document.getElementById("scan-area");
const startBtn = document.getElementById("start");
const restartBtn = document.getElementById("restart");

let streamActive = false;
let scanning = false;

async function startCamera() {
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
    resultDiv.textContent = "Błąd kamery: " + err.message;
  }
}


function tick() {
  if (!streamActive || !scanning) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const area = scanArea.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();

    const scaleX = canvas.width / videoRect.width; // 49-55, pixel scaling
    const scaleY = canvas.height / videoRect.height;

    const sx = (area.left - videoRect.left) * scaleX;
    const sy = (area.top - videoRect.top) * scaleY;
    const sw = area.width * scaleX;
    const sh = area.height * scaleY;

    const imageData = ctx.getImageData(sx, sy, sw, sh);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      scanning = false;
      resultDiv.innerHTML = "Odczytano: <b>" + code.data + "</b>";
      scanArea.style.borderColor = "lime";
    }
  }

  requestAnimationFrame(tick);
}

startBtn.addEventListener("click", startCamera);

restartBtn.addEventListener("click", async () => {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((track) => track.stop());
  }
  streamActive = false;
  scanning = false;
  scanArea.style.borderColor = "red";
  await startCamera();
});
