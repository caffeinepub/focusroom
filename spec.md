# Specification

## Summary
**Goal:** Fix the camera permission popup not triggering in `CameraPreview.tsx` by rewriting the camera toggle handler to call `getUserMedia` directly and immediately.

**Planned changes:**
- Replace the camera toggle handler in `CameraPreview.tsx` so it calls `navigator.mediaDevices.getUserMedia({ video: true, audio: false })` as the very first async operation, with no preceding async pre-checks
- Stop all tracks on any existing stream before requesting a new one
- On success, assign the stream to the video element ref and call `.play()`
- On failure, display the error message: "Camera access was denied. Please allow camera access when the browser prompt appears and try again."
- Apply a permanent inline CSS blur filter (`blur(12px) brightness(0.8) contrast(1.2)`) to the `<video>` element at all times
- Stop all tracks and clear the stream reference on component unmount
- Remove all legacy code paths (`enumerateDevices`, deviceId constraints, resolution constraints, feature-detection guards, pre-call try/catch wrappers)

**User-visible outcome:** Clicking the camera toggle button immediately triggers the browser's native permission popup, and upon granting access, the user sees a live blurred video feed. If access is denied, a clear error message is shown.
