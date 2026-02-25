import { useState, useRef, useEffect } from 'react';
import { Phase } from '../../backend';
import { useStoreEvent } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  phase: Phase | null;
}

interface ChatPanelProps {
  roomCode: string;
  phase: Phase | null;
  username: string;
}

export default function ChatPanel({ roomCode, phase, username }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { mutate: storeEvent, isPending: isSending } = useStoreEvent();

  const isFocus = phase === Phase.focus;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      username,
      text,
      timestamp: Date.now(),
      phase,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Store in backend as event
    storeEvent({
      name: `[${username}]: ${text}`,
      phase,
      date: BigInt(Date.now()) * BigInt(1_000_000),
      roomCode,
    });
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // A message is blurred if: current phase is focus AND (message was sent during focus OR current phase is focus)
  const isMessageBlurred = (msg: ChatMessage) => {
    return isFocus;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-room-border flex-shrink-0">
        <MessageSquare className="w-3.5 h-3.5 text-room-muted" />
        <span className="text-xs font-mono tracking-wider uppercase text-room-muted">Chat</span>
        {isFocus && (
          <span className="ml-auto text-xs font-mono text-room-muted/50 italic">
            Unlocks during break
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MessageSquare className="w-6 h-6 text-room-muted/20" />
            <p className="text-xs font-mono text-room-muted/40">
              {isFocus ? 'Messages are blurred during focus' : 'No messages yet'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const blurred = isMessageBlurred(msg);
            const isOwn = msg.username === username;
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-room-muted/60">{msg.username}</span>
                  <span className="text-xs font-mono text-room-muted/30">{formatTime(msg.timestamp)}</span>
                </div>
                <div
                  className={`max-w-[85%] px-3 py-1.5 rounded text-sm font-mono ${
                    isOwn
                      ? 'bg-focus-accent/15 text-room-text border border-focus-accent/20'
                      : 'bg-room-input text-room-text border border-room-border'
                  } ${blurred ? 'chat-blur-focus select-none' : ''}`}
                  style={blurred ? { filter: 'blur(8px)', userSelect: 'none' } : undefined}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-room-border p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isFocus ? 'Type a message (blurred during focus)...' : 'Type a message...'}
            className="flex-1 bg-room-input border-room-border text-room-text font-mono text-xs placeholder:text-room-muted/40 focus-visible:ring-focus-accent/50 h-8"
            maxLength={500}
          />
          <Button
            type="submit"
            disabled={isSending || !inputText.trim()}
            size="sm"
            className="bg-focus-accent hover:bg-focus-accent/90 text-room-bg h-8 w-8 p-0 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
