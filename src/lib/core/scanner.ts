import { Html5Qrcode } from "html5-qrcode";

export class Scanner {
  private html5QrCode: Html5Qrcode | null = null;
  private isRunning: boolean = false;

  constructor(private elementId: string) {}

  private currentCameraIndex: number = 0;
  private availableCameras: any[] = [];
  private onScanSuccessCallback: any = null;
  private onScanFailureCallback: any = null;

  async start(onScanSuccess: (decodedText: string) => void, onScanFailure?: (error: any) => void) {
    if (this.isRunning) return;
    this.onScanSuccessCallback = onScanSuccess;
    this.onScanFailureCallback = onScanFailure;
    this.html5QrCode = new Html5Qrcode(this.elementId);
    
    try {
      this.availableCameras = await Html5Qrcode.getCameras();
      
      let cameraId: string | { facingMode: string } = { facingMode: "environment" };

      if (this.availableCameras && this.availableCameras.length > 0) {
        // Tenta encontrar a câmera "Wide" (que é a 1x) e evitar a "Ultra Wide" (0.5x)
        // No Android/Chrome, a 0.5x costuma ter "ultra" no nome.
        const backCameras = this.availableCameras.filter(c => 
          /back|rear|traseira/i.test(c.label)
        );

        if (backCameras.length > 0) {
          // Heurística: Preferir a câmera que NÃO contenha "ultra" ou "0.5"
          // Mas que contenha "wide" ou "main" (a 1x no iPhone é "Wide Camera")
          const mainCamera = backCameras.find(c => 
            !/ultra|0\.5|macro/i.test(c.label.toLowerCase()) && 
            (/wide|main|principal/i.test(c.label.toLowerCase()) || backCameras.length === 1)
          ) || backCameras[0];

          cameraId = mainCamera.id;
          this.currentCameraIndex = this.availableCameras.indexOf(mainCamera);
        }
      }

      await this.launchScanner(cameraId);
      this.isRunning = true;
    } catch (err) {
      console.error("Error starting scanner", err);
      throw err;
    }
  }

  private async launchScanner(cameraId: string | { facingMode: string }) {
    if (!this.html5QrCode) return;
    
    await this.html5QrCode.start(
      cameraId,
      {
        fps: 60,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdgePercentage = 0.85;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: 1.0,
      },
      this.onScanSuccessCallback,
      this.onScanFailureCallback
    );
  }

  async switchCamera() {
    if (!this.html5QrCode || this.availableCameras.length < 2) return;
    
    this.currentCameraIndex = (this.currentCameraIndex + 1) % this.availableCameras.length;
    const nextCamera = this.availableCameras[this.currentCameraIndex];
    
    await this.html5QrCode.stop();
    await this.launchScanner(nextCamera.id);
  }

  hasMultipleCameras(): boolean {
    return this.availableCameras.length > 1;
  }

  async stop() {
    if (this.html5QrCode && this.isRunning) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
        this.isRunning = false;
      } catch (err) {
        console.error("Error stopping scanner", err);
      }
    }
  }
}