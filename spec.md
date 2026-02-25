# Specification

## Summary
**Goal:** Rewrite the camera toggle logic in `CameraPreview.tsx` so that clicking the camera button reliably triggers the browser's native permission popup and displays a blurred video feed.

**Planned changes:**
- Rewrite `CameraPreview.tsx` camera toggle handler to call `navigator.mediaDevices.getUserMedia({ video: true, audio: false })` directly, with no prior async checks, `enumerateDevices()`, device filtering, or feature-detection guards.
- On success, assign the stream to `videoRef.current.srcObject` and call `videoRef.current.play()`.
- On failure, catch the error and display a human-readable error message to the user inside the component.
- Apply a permanent CSS blur filter (`blur(12px)` with brightness/contrast) to the `<video>` element that is never conditionally removed.
- Ensure the media stream is fully stopped and all tracks released on component unmount or when the camera is toggled off.
- Remove all legacy code paths from previous fix attempts (enumerateDevices checks, overconstrained retries, deviceId constraints).

**User-visible outcome:** Clicking the camera toggle button triggers the browser's native camera permission popup. After granting permission, a permanently blurred video feed appears. If permission is denied, a clear error message is shown. The camera works correctly across Chrome, Firefox, and Safari.
