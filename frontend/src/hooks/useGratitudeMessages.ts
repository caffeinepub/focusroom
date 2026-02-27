const MESSAGES = [
  'Many want to study but cannot afford internet. Thank your Lord.',
  'Many are praying for opportunity. You are inside it. Alhamdulillah.',
  'Not everyone gets time, access, and ability together. You do. Thank your Lord.',
  'Learning is rizq.',
  'You are in a position many wish for.',
  'Some want education but doors were closed. Yours are open. Thank your creator.',
  'Rabbi zidni ilma — My Lord, increase me in knowledge.',
];

const STORAGE_KEY = 'gratitude-messages-state';

interface GratitudeState {
  queue: number[];   // shuffled indices
  index: number;     // current position in queue
}

function fisherYatesShuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadState(): GratitudeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GratitudeState;
      if (
        Array.isArray(parsed.queue) &&
        parsed.queue.length === MESSAGES.length &&
        typeof parsed.index === 'number'
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return {
    queue: fisherYatesShuffle(MESSAGES.map((_, i) => i)),
    index: 0,
  };
}

function saveState(state: GratitudeState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Returns the next gratitude message in a shuffled cycle.
 * Persists state to localStorage so the sequence survives page reloads.
 * Call `getNextMessage()` once per completed focus session.
 */
export function useGratitudeMessages() {
  function getNextMessage(): string {
    const state = loadState();
    const message = MESSAGES[state.queue[state.index]];

    let nextIndex = state.index + 1;
    let nextQueue = state.queue;

    if (nextIndex >= MESSAGES.length) {
      nextQueue = fisherYatesShuffle(MESSAGES.map((_, i) => i));
      nextIndex = 0;
    }

    saveState({ queue: nextQueue, index: nextIndex });
    return message;
  }

  return { getNextMessage };
}
