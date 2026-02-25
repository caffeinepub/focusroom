import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { Phase } from '../../backend';

type SoundOption = 'off' | 'rain' | 'library' | 'whitenoise';

const SOUND_LABELS: Record<SoundOption, string> = {
  off: 'Off',
  rain: '🌧 Rain',
  library: '📚 Library',
  whitenoise: '〰 White Noise',
};

const SOUND_PATHS: Record<Exclude<SoundOption, 'off'>, string> = {
  rain: '/assets/sounds/rain.mp3',
  library: '/assets/sounds/library.mp3',
  whitenoise: '/assets/sounds/whitenoise.mp3',
};

const STORAGE_KEY = 'focusroom_ambient_sound';
const VOLUME = 0.3;

interface AmbientSoundToggleProps {
  phase: Phase | null;
}

export default function AmbientSoundToggle({ phase }: AmbientSoundToggleProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SoundOption>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as SoundOption) || 'off';
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFocus = phase === Phase.focus;

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const playAudio = useCallback((sound: Exclude<SoundOption, 'off'>) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(SOUND_PATHS[sound]);
    audio.loop = true;
    audio.volume = VOLUME;
    audioRef.current = audio;
    audio.play().catch(() => {
      // Autoplay blocked - user interaction required
    });
  }, []);

  // React to phase or selection changes
  useEffect(() => {
    if (selected === 'off' || !isFocus) {
      stopAudio();
    } else {
      playAudio(selected as Exclude<SoundOption, 'off'>);
    }

    return () => {
      stopAudio();
    };
  }, [selected, isFocus, playAudio, stopAudio]);

  const handleSelect = (option: SoundOption) => {
    setSelected(option);
    localStorage.setItem(STORAGE_KEY, option);
    setOpen(false);
  };

  const isPlaying = selected !== 'off' && isFocus;

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Ambient sounds"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all border ${
          isPlaying
            ? 'bg-focus-accent/15 border-focus-accent/40 text-focus-accent'
            : 'bg-room-surface border-room-border text-room-muted hover:text-room-text hover:bg-room-input'
        }`}
      >
        {isPlaying ? (
          <Volume2 className="w-3.5 h-3.5" />
        ) : (
          <VolumeX className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">
          {selected === 'off' ? 'Sounds' : SOUND_LABELS[selected]}
        </span>
        <Music className="w-3 h-3 opacity-50 sm:hidden" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full mb-2 right-0 z-50 bg-room-surface border border-room-border rounded-lg shadow-xl overflow-hidden min-w-[160px]">
            <div className="px-3 py-2 border-b border-room-border">
              <span className="text-xs font-mono text-room-muted uppercase tracking-wider">
                Ambient Sound
              </span>
            </div>
            {(Object.keys(SOUND_LABELS) as SoundOption[]).map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors flex items-center gap-2 ${
                  selected === option
                    ? 'bg-focus-accent/15 text-focus-accent'
                    : 'text-room-muted hover:bg-room-input hover:text-room-text'
                }`}
              >
                {selected === option && (
                  <span className="w-1.5 h-1.5 rounded-full bg-focus-accent flex-shrink-0" />
                )}
                {selected !== option && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                {SOUND_LABELS[option]}
              </button>
            ))}
            {!isFocus && selected !== 'off' && (
              <div className="px-3 py-2 border-t border-room-border">
                <span className="text-xs font-mono text-room-muted/50">
                  Plays during Focus only
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
