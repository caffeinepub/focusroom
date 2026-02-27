import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  author: string;
  text: string;
  timestamp: Date;
  isLocal: boolean;
}

interface ChatPanelProps {
  roomId: string;
}

export default function ChatPanel({ roomId: _roomId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      author: 'System',
      text: 'Welcome to the study room! Chat is always open.',
      timestamp: new Date(),
      isLocal: false,
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const msg: Message = {
      id: Date.now().toString(),
      author: 'You',
      text,
      timestamp: new Date(),
      isLocal: true,
    };
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col gap-0.5 ${msg.isLocal ? 'items-end' : 'items-start'}`}
          >
            {!msg.isLocal && (
              <span className="text-xs px-1" style={{ color: 'oklch(0.50 0.02 260)' }}>
                {msg.author}
              </span>
            )}
            <div
              className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
              style={
                msg.isLocal
                  ? {
                      background: 'linear-gradient(135deg, oklch(0.72 0.18 195 / 0.25) 0%, oklch(0.65 0.20 210 / 0.2) 100%)',
                      border: '1px solid oklch(0.72 0.18 195 / 0.3)',
                      color: 'oklch(0.88 0.01 260)',
                    }
                  : msg.author === 'System'
                  ? {
                      background: 'oklch(0.18 0.022 260)',
                      border: '1px solid oklch(0.26 0.025 260)',
                      color: 'oklch(0.55 0.02 260)',
                      fontStyle: 'italic',
                    }
                  : {
                      background: 'oklch(0.19 0.022 260)',
                      border: '1px solid oklch(0.26 0.025 260)',
                      color: 'oklch(0.82 0.01 260)',
                    }
              }
            >
              {msg.text}
            </div>
            <span className="text-xs px-1" style={{ color: 'oklch(0.38 0.02 260)' }}>
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 border-t"
        style={{ borderColor: 'oklch(0.22 0.022 260)' }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message…"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all duration-200"
            style={{
              background: 'oklch(0.12 0.015 260)',
              border: '1px solid oklch(0.24 0.022 260)',
              color: 'oklch(0.88 0.01 260)',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'oklch(0.72 0.18 195 / 0.5)';
              e.currentTarget.style.boxShadow = '0 0 0 2px oklch(0.72 0.18 195 / 0.1)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'oklch(0.24 0.022 260)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-40 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, oklch(0.72 0.18 195) 0%, oklch(0.65 0.20 210) 100%)',
              color: 'oklch(0.10 0.01 260)',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
