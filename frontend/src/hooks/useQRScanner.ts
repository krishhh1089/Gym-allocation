import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';

export interface UseQRScannerOptions {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
  fps?: number;
  qrbox?: number | { width: number; height: number };
}

export interface UseQRScannerReturn {
  isScanning: boolean;
  hasPermission: boolean | null;
  errorMessage: string | null;
  devices: CameraDevice[];
  selectedDeviceId: string;
  isTorchOn: boolean;
  isTorchSupported: boolean;
  startScanning: (deviceId?: string) => Promise<void>;
  stopScanning: () => Promise<void>;
  toggleTorch: () => Promise<void>;
  setSelectedDeviceId: (deviceId: string) => void;
}

export function useQRScanner(
  elementId: string,
  options: UseQRScannerOptions
): UseQRScannerReturn {
  const { onScanSuccess, onScanError, fps = 10, qrbox = 250 } = options;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);

  // Initialize and enumerate video input devices
  useEffect(() => {
    let isMounted = true;

    Html5Qrcode.getCameras()
      .then((cameraDevices) => {
        if (!isMounted) return;
        if (cameraDevices && cameraDevices.length > 0) {
          setDevices(cameraDevices);
          // Prefer back/environment camera if available
          const backCam = cameraDevices.find((c) =>
            /back|rear|environment/i.test(c.label)
          );
          setSelectedDeviceId(backCam ? backCam.id : cameraDevices[0].id);
          setHasPermission(true);
        } else {
          setErrorMessage('No camera devices discovered on this system.');
          setHasPermission(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Camera enumeration error or permission not granted yet:', err);
        setHasPermission(false);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Camera permission denied or camera device unavailable.'
        );
      });

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((e) => console.warn('Error stopping scanner on unmount:', e));
      }
    };
  }, []);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        setIsScanning(false);
        setIsTorchOn(false);
      } catch (err) {
        console.warn('Failed to stop scanner cleanly:', err);
      }
    }
  }, []);

  const startScanning = useCallback(
    async (deviceId?: string) => {
      const targetDevice = deviceId || selectedDeviceId;

      try {
        setErrorMessage(null);
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(elementId);
        }

        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }

        // Camera config: if specific device ID available use it, else default facing mode
        const cameraConfig = targetDevice
          ? targetDevice
          : { facingMode: 'environment' };

        await scannerRef.current.start(
          cameraConfig,
          {
            fps,
            qrbox,
            aspectRatio: 1.0,
          },
          (decodedText) => {
            onScanSuccess(decodedText);
          },
          (scanErr) => {
            // Per-frame minor decode failures are ordinary; dispatch only if requested
            if (onScanError) {
              onScanError(scanErr);
            }
          }
        );

        setIsScanning(true);
        setHasPermission(true);

        // Check torch capability
        try {
          const capabilities = scannerRef.current.getRunningTrackCapabilities();
          // @ts-expect-error torch is experimental in MediaTrackCapabilities
          setIsTorchSupported(Boolean(capabilities && capabilities.torch));
        } catch {
          setIsTorchSupported(false);
        }
      } catch (err) {
        console.error('Failed to start camera scanner:', err);
        setIsScanning(false);
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to start camera stream. Verify device permissions.';
        setErrorMessage(msg);
      }
    },
    [elementId, selectedDeviceId, fps, qrbox, onScanSuccess, onScanError]
  );

  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current || !scannerRef.current.isScanning || !isTorchSupported) {
      return;
    }
    try {
      const nextTorch = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        // @ts-expect-error torch in advanced constraints
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  }, [isTorchOn, isTorchSupported]);

  return {
    isScanning,
    hasPermission,
    errorMessage,
    devices,
    selectedDeviceId,
    isTorchOn,
    isTorchSupported,
    startScanning,
    stopScanning,
    toggleTorch,
    setSelectedDeviceId,
  };
}
