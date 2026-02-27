import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

type PermissionState = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

interface CameraPreviewProps {
  onStreamReady?: (stream: MediaStream) => void;
  onStreamStop?: () => void;
}

export default function CameraPreview({ onStreamReady, onStreamStop }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setPermissionState('idle');
    onStreamStop?.();
  }, [onStreamStop]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // This function MUST be called directly from a click handler (synchronous user gesture)
  // to ensure the browser shows the native permission dialog.
  const enableCamera = () => {
    // Immediately set requesting state AFTER initiating getUserMedia
    // The getUserMedia call must be the FIRST thing that happens in the click handler
    // to preserve the user gesture context.
    const mediaPromise = navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });

    setPermissionState('requesting');
    setErrorMessage('');

    mediaPromise
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setPermissionState('active');
        onStreamReady?.(stream);
      })
      .catch((err: DOMException | Error) => {
        const name = (err as DOMException).name || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setPermissionState('denied');
          setErrorMessage('Camera access was denied.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setPermissionState('error');
          setErrorMessage('No camera found on this device.');
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
          setPermissionState('error');
          setErrorMessage('Camera is in use by another application.');
        } else {
          setPermissionState('error');
          setErrorMessage('Could not access camera. Please try again.');
        }
      });
  };

  const handleRetry = () => {
    // Same pattern: getUserMedia must be called first, synchronously in the click handler
    const mediaPromise = navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });

    setPermissionState('requesting');
    setErrorMessage('');

    mediaPromise
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setPermissionState('active');
        onStreamReady?.(stream);
      })
      .catch((err: DOMException | Error) => {
        const name = (err as DOMException).name || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setPermissionState('denied');
          setErrorMessage('Camera access was denied.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setPermissionState('error');
          setErrorMessage('No camera found on this device.');
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
          setPermissionState('error');
          setErrorMessage('Camera is in use by another application.');
        } else {
          setPermissionState('error');
          setErrorMessage('Could not access camera. Please try again.');
        }
      });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Video preview */}
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{ aspectRatio: '16/9', background: 'oklch(0.10 0.012 260)' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ display: permissionState === 'active' ? 'block' : 'none' }}
        />

        {/* Overlay states */}
        {permissionState !== 'active' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            {permissionState === 'idle' && (
              <>
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'oklch(0.20 0.025 260)' }}>
                  <Camera className="w-7 h-7" style={{ color: 'oklch(0.72 0.18 195)' }} />
                </div>
                <p className="text-sm text-center" style={{ color: 'oklch(0.58 0.02 260)' }}>
                  Camera is off
                </p>
              </>
            )}

            {permissionState === 'requesting' && (
              <>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'oklch(0.72 0.18 195)' }} />
                <p className="text-sm text-center" style={{ color: 'oklch(0.72 0.18 195)' }}>
                  Requesting camera access…
                </p>
              </>
            )}

            {permissionState === 'denied' && (
              <div className="flex flex-col items-center gap-3 text-center max-w-xs">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'oklch(0.18 0.04 25)' }}>
                  <AlertCircle className="w-7 h-7" style={{ color: 'oklch(0.65 0.22 25)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'oklch(0.80 0.01 260)' }}>
                    Camera access denied
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.55 0.02 260)' }}>
                    To enable your camera, click the <strong style={{ color: 'oklch(0.72 0.18 195)' }}>camera icon</strong> in your browser's address bar and select <strong style={{ color: 'oklch(0.72 0.18 195)' }}>Allow</strong>, then click Retry below.
                  </p>
                </div>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'oklch(0.72 0.18 195)',
                    color: 'oklch(0.10 0.01 260)',
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            )}

            {permissionState === 'error' && (
              <div className="flex flex-col items-center gap-3 text-center max-w-xs">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'oklch(0.18 0.04 25)' }}>
                  <AlertCircle className="w-7 h-7" style={{ color: 'oklch(0.65 0.22 25)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'oklch(0.80 0.01 260)' }}>
                    Camera error
                  </p>
                  <p className="text-xs" style={{ color: 'oklch(0.55 0.02 260)' }}>
                    {errorMessage}
                  </p>
                </div>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'oklch(0.72 0.18 195)',
                    color: 'oklch(0.10 0.01 260)',
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {permissionState === 'active' ? (
          <button
            onClick={stopStream}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: 'oklch(0.20 0.04 25)',
              color: 'oklch(0.75 0.18 25)',
              border: '1px solid oklch(0.30 0.06 25)',
            }}
          >
            <CameraOff className="w-4 h-4" />
            Turn off camera
          </button>
        ) : permissionState === 'idle' ? (
          <button
            onClick={enableCamera}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: 'oklch(0.72 0.18 195)',
              color: 'oklch(0.10 0.01 260)',
              boxShadow: '0 0 16px oklch(0.72 0.18 195 / 0.3)',
            }}
          >
            <Camera className="w-4 h-4" />
            Enable camera
          </button>
        ) : null}

        {permissionState === 'active' && (
          <div className="flex items-center gap-2">
            <div className="status-dot-active" />
            <span className="text-xs" style={{ color: 'oklch(0.65 0.18 145)' }}>Live</span>
          </div>
        )}
      </div>
    </div>
  );
}
