import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface CameraPreviewProps {
  username: string;
}

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

export default function CameraPreview({ username }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stopStreamTracks();
    };
  }, []);

  const stopStreamTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    // Stop any existing stream first
    stopStreamTracks();

    setCameraState('requesting');
    setErrorMessage('');

    let stream: MediaStream;

    try {
      // Directly call getUserMedia — no pre-checks, no enumerateDevices
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (err: unknown) {
      const error = err as DOMException;
      if (
        error.name === 'NotAllowedError' ||
        error.name === 'PermissionDeniedError' ||
        error.name === 'SecurityError'
      ) {
        setCameraState('denied');
        setErrorMessage(
          'Camera access was denied. Please allow camera access in your browser settings and try again.'
        );
      } else if (
        error.name === 'NotFoundError' ||
        error.name === 'DevicesNotFoundError' ||
        error.name === 'OverconstrainedError'
      ) {
        setCameraState('error');
        setErrorMessage(
          'No camera found. Make sure a camera is connected and not in use by another app.'
        );
      } else if (
        error.name === 'NotReadableError' ||
        error.name === 'TrackStartError' ||
        error.name === 'AbortError'
      ) {
        setCameraState('error');
        setErrorMessage(
          'Camera is already in use by another application. Close other apps using the camera and try again.'
        );
      } else {
        setCameraState('error');
        setErrorMessage(
          (err as DOMException).message ||
            'An unexpected error occurred accessing the camera. Please try again.'
        );
      }
      return;
    }

    // Stream acquired — attach to video element
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      // Explicitly call play() — required in some browsers when element was hidden
      try {
        await videoRef.current.play();
      } catch {
        // play() rejection is non-fatal (e.g. autoplay policy); stream is still attached
      }
    }

    setCameraState('active');
  };

  const stopCamera = () => {
    stopStreamTracks();
    setCameraState('idle');
    setErrorMessage('');
  };

  const retry = () => {
    setErrorMessage('');
    setCameraState('idle');
    // Small delay to let state settle before re-requesting
    setTimeout(() => startCamera(), 100);
  };

  const isActive = cameraState === 'active';
  const isLoading = cameraState === 'requesting';
  const isDenied = cameraState === 'denied';
  const hasError = cameraState === 'denied' || cameraState === 'error';

  return (
    <div className="bg-room-surface border border-room-border rounded-lg overflow-hidden">
      {/* Camera viewport */}
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        {/*
          Video element is always rendered in the DOM so srcObject can be set
          before the state transition makes it visible. Blur is permanent via CSS class.
        */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-blur-permanent absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: isActive ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Placeholder when camera is off */}
        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-room-input gap-2">
            <CameraOff className="w-8 h-8 text-room-muted/30" />
            <span className="text-xs font-mono text-room-muted/40">Camera off</span>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-room-bg/80 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-room-muted" />
            <span className="text-xs font-mono text-room-muted/60">Waiting for permission…</span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className={`text-xs font-mono px-1.5 py-0.5 rounded ${
              isActive
                ? 'bg-focus-accent/20 text-focus-accent border border-focus-accent/30'
                : 'bg-room-muted/10 text-room-muted/50 border border-room-border'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Username badge */}
        <div className="absolute bottom-2 left-2 z-10">
          <span className="text-xs font-mono text-room-muted/70 bg-room-bg/60 px-1.5 py-0.5 rounded">
            {username}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-2 border-t border-room-border space-y-2">
        {/* Error message */}
        {hasError && errorMessage && (
          <div className="rounded border border-destructive/30 bg-destructive/10 p-2 space-y-1">
            <div className="flex items-start gap-1.5 text-xs font-mono text-destructive">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
            {isDenied && (
              <p className="text-xs font-mono text-room-muted/60 pl-5">
                In Chrome: click the camera icon in the address bar → Allow.
              </p>
            )}
          </div>
        )}

        <Button
          onClick={hasError ? retry : isActive ? stopCamera : startCamera}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className="w-full text-xs font-mono text-room-muted hover:text-room-text hover:bg-room-input gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : hasError ? (
            <RefreshCw className="w-3.5 h-3.5" />
          ) : isActive ? (
            <CameraOff className="w-3.5 h-3.5" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
          {isLoading
            ? 'Waiting for permission…'
            : hasError
            ? 'Try Again'
            : isActive
            ? 'Turn Off Camera'
            : 'Turn On Camera'}
        </Button>
      </div>
    </div>
  );
}
