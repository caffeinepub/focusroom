# Specification

## Summary
**Goal:** Fix the indefinite "connecting" state that prevents users from entering the app after authentication.

**Planned changes:**
- Investigate and fix the authentication/actor initialization flow where the "connecting" state gets stuck and never transitions to the authenticated state
- Add a timeout mechanism (15 seconds) to the connecting/initialization phase so it does not hang indefinitely
- If the timeout is reached, display a user-friendly error message with a "Try Again" or "Return to Login" button
- Fix the flow in consuming components (without modifying `useInternetIdentity.ts` or `useActor.ts` directly) so that after Internet Identity login, the app correctly proceeds to the lobby or room page

**User-visible outcome:** Users can successfully log in and enter the app without getting stuck on a "connecting" screen. If a connection genuinely fails, they see a clear error message and a way to retry.
