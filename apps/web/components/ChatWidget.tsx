'use client';

import { useEffect, useRef, useState } from 'react';

interface ChatWidgetProps {
  open: boolean;
  onClose: () => void;
  tenantSlug: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

function getOrCreateSessionId(): string {
  const key = 'chat_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `web_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export default function ChatWidget({ open, onClose, tenantSlug }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: '¡Hola! 👋 ¿Querés reservar un turno o tenés alguna consulta?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!open) return null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/agent/web-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantSlug, sessionId: getOrCreateSessionId(), text }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply || 'Te vamos a derivar con una persona del equipo en breve.' },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Ups, hubo un error de conexión. Probá de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 h-[28rem] bg-paper rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-charcoal/10 animate-scalein">
      <div className="bg-ink text-paper px-4 py-3.5 flex justify-between items-center">
        <span className="font-display text-lg tracking-wide">ASISTENTE</span>
        <button onClick={onClose} aria-label="Cerrar chat" className="hover:text-brass transition">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-charcoal/[0.03]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
              m.role === 'user' ? 'bg-ink text-paper ml-auto' : 'bg-white border border-charcoal/10'
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="text-xs text-charcoal/40">Escribiendo…</div>}
        <div ref={bottomRef} />
      </div>

      <div className="flex border-t border-charcoal/10 p-2 gap-2 bg-paper">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Escribí tu mensaje…"
          className="flex-1 border border-charcoal/20 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brass transition"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-ink text-paper rounded-full px-4 text-sm font-medium disabled:opacity-50 hover:bg-brass hover:text-ink transition"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
