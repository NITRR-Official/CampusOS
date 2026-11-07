'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export function CameraScannerModal({
  isOpen,
  onClose,
  onScan
}: CameraScannerModalProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = 'html5-camera-qr-reader';

  // Initialize and list cameras
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCameraError(null);
    setIsInitializing(true);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return;
        if (!devices || devices.length === 0) {
          setCameraError(
            'No camera found on this device. Please use manual code entry.'
          );
          setIsInitializing(false);
          return;
        }

        setCameras(devices);
        // Prefer back camera if available, otherwise first camera
        const backCamera = devices.find((d) =>
          d.label.toLowerCase().includes('back')
        );
        setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        setIsInitializing(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Camera permission/access error:', err);
        setCameraError(
          'Camera access was denied or is unavailable. Please grant permission in your browser.'
        );
        setIsInitializing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Start scanning when camera is selected
  useEffect(() => {
    if (!isOpen || !selectedCameraId) return;

    const html5QrCode = new Html5Qrcode(regionId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Play subtle beep audio feedback
          try {
            const ctx = new (
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext
            )();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          } catch {
            // Audio context not available or user interacted
          }

          onScan(decodedText);
          onClose();
        },
        () => {
          // Frame without QR code - ignore
        }
      )
      .catch((err) => {
        console.error('Failed to start scanner with camera:', err);
        setCameraError('Failed to start video stream with selected camera.');
      });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch((err) => console.warn('Error stopping scanner:', err));
      }
    };
  }, [isOpen, selectedCameraId, onScan, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">
              Live QR Scanner
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Camera Selector (if multiple) */}
        {cameras.length > 1 && (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">Camera:</span>
            <select
              value={selectedCameraId || ''}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground outline-none focus:border-primary"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id.substring(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Viewfinder Area */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black flex items-center justify-center">
          <div id={regionId} className="w-full h-full" />

          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 space-y-3 text-white">
              <RefreshCw className="size-8 animate-spin text-primary" />
              <p className="text-xs">Accessing camera...</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center space-y-3 text-white">
              <AlertCircle className="size-10 text-rose-500" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Use Manual Code Entry
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Point your laptop camera or phone at the student’s digital ticket
          pass.
        </p>
      </div>
    </div>,
    document.body
  );
}
