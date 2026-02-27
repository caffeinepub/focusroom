# Specification

## Summary
**Goal:** Add a post-session gratitude scratch card feature to FocusRoom that rewards users with a motivational message after each completed focus session.

**Planned changes:**
- After a focus session ends (before the break phase), display a small golden card icon in the bottom-right corner of the screen that does not overlap the timer or any interactive UI elements
- The icon persists until clicked or until the next session starts
- Clicking the golden card triggers a scratch-reveal animation (canvas-based or CSS wipe) that uncovers a hidden motivational/gratitude message beneath
- Maintain a predefined list of seven gratitude messages, displayed one per session in shuffled order; once all seven are shown, reshuffle and repeat
- Persist the shuffle state in localStorage so the sequence survives page reloads
- The seven messages are: "Many want to study but cannot afford internet. Thank your Lord.", "Many are praying for opportunity. You are inside it. Alhamdulillah.", "Not everyone gets time, access, and ability together. You do. Thank your Lord.", "Learning is rizq.", "You are in a position many wish for.", "Some want education but doors were closed. Yours are open. Thank your creator.", "Rabbi zidni ilma — My Lord, increase me in knowledge."

**User-visible outcome:** After finishing a focus session, users see a subtle golden card icon in the corner. Clicking it reveals a satisfying scratch animation that uncovers one of seven rotating gratitude messages, encouraging mindfulness and thankfulness without interrupting the session flow.
