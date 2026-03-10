/**
 * @file Implementacja komponentu ScanButton, odpowiadającego za obsługę skanowania kodów QR.
 * @author Karol Dziuba i Karol Jurewicz
 * */

import React from "react";
import Popup, {Alert} from "../custom_components/Popup.tsx";
import CustomTooltip from "../custom_components/CustomTooltip.tsx";
import jsQR from "jsqr";
import './ScanButton.css'

import QRIcon from '/assets/qr_code.svg'

/**
 * @interface ScanButtonProps
 * @prop {(value: string) => void} [onScan] funkcja wywołana po uzyskaniu informacji z kodu QR przekazuje mu pozyskane informacje jako parametr
 * @prop {string} [enabledTooltipMessage] wiadomość wyświetlana w tooltipie, gdy skaner jest włączony (w widoku mobilnym)
 * */
interface ScanButtonProps {
  onScan?: (value: string) => void;
  text?: string;
  enabledTooltipMessage?: string;
}
/**
 * @interface ScanButtonState
 * @prop {boolean} isMobile stan określający czy komponent jest uruchomiony na urządzeniu mobilnym
 * @prop {boolean} open stan określający czy popup skanowania jest otwarty
 * @prop {string} error wiadomość wyświetlana w przypadku wystąpienia błędu podczas skanowania
 * */
interface ScanButtonState {
  isMobile: boolean;
  open: boolean;
  error: string,
}

/**
 * @class ScanButton
 * Wyświetla przycisk skanowania kodu QR.
 * - Na desktopie przycisk jest zablokowany
 * - Na mobile otwiera Popup i uruchamia kamerę
 * - Cała logika skanera jest w tym pliku
 * @extends React.Component
 * @prop {ScanButtonProps} state
 * @prop {ScanButtonProps} props
 */
class ScanButton extends React.Component<ScanButtonProps, ScanButtonState> {
  state: ScanButtonState

  videoRef = React.createRef<HTMLVideoElement>();
  canvasRef = React.createRef<HTMLCanvasElement>();
  scanAreaRef = React.createRef<HTMLDivElement>();

  scanningRef = false;
  streamRef: MediaStream | null = null;

  constructor(props: ScanButtonProps) {
    super(props);
    this.state = {
      // todo: change that in production
      isMobile: true, // /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
      error: '',
      open: false
    };

  }

  componentDidMount() {
    this.setState({
      isMobile: true // /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    });
  }

  componentDidUpdate(prevProps: { onScan?: (value: string) => void }, prevState: { open: boolean }) {
    if (!prevState.open && this.state.open) {
      this.startScanning();
    } else if (prevState.open && !this.state.open) {
      this.stopScanning();
    }
  }

  componentWillUnmount() {
    this.stopScanning();
  }

  /**
   * @event startScanning obsługuje skanowanie po kliknięciu komponentu
   * */
  private startScanning = () => {
    const video = this.videoRef.current;
    const canvas = this.canvasRef.current;
    const scanArea = this.scanAreaRef.current;
    const ctx = canvas?.getContext("2d");

    if (!video || !canvas || !scanArea || !ctx) return;

    this.scanningRef = true;
    try{
      this.startCamera(video, canvas, scanArea, ctx);
    }
    catch(e: any){
      this.setState({error: e.message});
    }
  }

  private stopScanning = () => {
    this.scanningRef = false;
    this.streamRef?.getTracks().forEach((t) => t.stop());
    this.streamRef = null;
  };

  private startCamera = async (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      scanArea: HTMLDivElement,
      ctx: CanvasRenderingContext2D
  ) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {facingMode: "environment"},
    });

    this.streamRef = stream;
    video.srcObject = stream;
    await video.play();
    requestAnimationFrame(() => this.tick(video, canvas, scanArea, ctx));
  };

  private tick = (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      scanArea: HTMLDivElement,
      ctx: CanvasRenderingContext2D
  ) => {
    if (!this.scanningRef) return;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(() => this.tick(video, canvas, scanArea, ctx));
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
      this.scanningRef = false;
      this.props.onScan?.(code.data);
      this.setState({open: false});
      return;
    }

    requestAnimationFrame(() => this.tick(video, canvas, scanArea, ctx));
  };

  render() {
    const {isMobile, open} = this.state;

    return (
        <>
          <CustomTooltip
              title={
                isMobile
                    ? (this.props.enabledTooltipMessage ?? "Skanuj kod QR")
                    : "Skanowanie dostępne tylko na urządzeniach mobilnych"
              }
          >
            <button
                type="button"
                disabled={!isMobile}
                onClick={() => isMobile && this.setState({open: true})}
                className="scan-button"
            >
              <img src={QRIcon} alt={"Skanuj QR"}/>
              {this.props.text ?? ''}
            </button>
          </CustomTooltip>

          <Popup
              title="Skanowanie QR"
              isOpen={open}
              setIsOpen={(open: boolean) => this.setState({open: open})}
          >
            <div style={{position: "relative"}}>
              <video ref={this.videoRef} playsInline style={{width: "100%"}}/>
              <canvas ref={this.canvasRef} style={{display: "none"}}/>
              <div
                  ref={this.scanAreaRef}
                  className='scan-area'>
                <div className='scan-area-indicator' style={{
                  top: 0,
                  left: 0,
                  borderTop: '3px solid red',
                  borderLeft: '3px solid red'
                }}/>
                <div className='scan-area-indicator'  style={{
                  top: 0,
                  right: 0,
                  borderTop: '3px solid red',
                  borderRight: '3px solid red'
                }}/>
                <div className='scan-area-indicator'  style={{
                  bottom: 0,
                  left: 0,
                  borderBottom: '3px solid red',
                  borderLeft: '3px solid red'
                }}/>
                <div className='scan-area-indicator'  style={{
                  bottom: 0,
                  right: 0,
                  borderBottom: '3px solid red',
                  borderRight: '3px solid red'
                }}/>
              </div>
            </div>
          </Popup>
          <Alert
            title="Błąd skanowania"
            message={this.state.error}
            isOpen={this.state.error !== ''}
            setIsOpen={(open: boolean) => this.setState({error: ''})}
          />

        </>
    );
  }
}

export default ScanButton;
