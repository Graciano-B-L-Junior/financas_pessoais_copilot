"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types";

interface ApiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface SendResponse {
  status: number;
  data: {
    status: number;
    status_text: string;
    message?: string;
    data?: ApiChatMessage & { session_id: string };
  } | null;
}

interface HistoryResponse {
  status: number;
  data: {
    status: number;
    data?: { session_id: string; messages: ApiChatMessage[] };
  } | null;
}

const MSG_UNAVAILABLE =
  "O assistente está temporariamente indisponível. Tente novamente em instantes.";
const MSG_RATE_LIMIT =
  "Limite de mensagens atingido. Aguarde um momento e tente novamente.";

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Carrega histórico ao abrir pela primeira vez
  useEffect(() => {
    if (!open || historyLoaded) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/chat/history");
        if (!res.ok || cancelled) return;
        const json: HistoryResponse["data"] = await res.json();
        if (json?.data?.messages && !cancelled) {
          setMessages(
            json.data.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              created_at: m.created_at,
            }))
          );
          setHistoryLoaded(true);
        }
      } catch {
        // histórico indisponível — não bloqueia o chat
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, historyLoaded]);

  // Scroll para o final ao receber nova mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Foco no input ao abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    if (text.length < 2 || text.length > 500) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const json = await res.json().catch(() => null);

      if (res.status === 429) {
        appendError(MSG_RATE_LIMIT);
        return;
      }

      if (!res.ok || !json?.data) {
        appendError(MSG_UNAVAILABLE);
        return;
      }

      const assistantMsg: ChatMessage = {
        id: json.data.id,
        role: "assistant",
        // SEC-002: content tratado como texto plano — renderizado com textContent via React
        content: json.data.content,
        created_at: json.data.created_at,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      appendError(MSG_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  }

  function appendError(text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  async function handleClear() {
    try {
      await fetch("/api/chat/history", { method: "DELETE" });
    } catch {
      // silencia — limpa localmente de qualquer forma
    }
    setMessages([]);
    setHistoryLoaded(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        className="ai-chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar assistente financeiro" : "Abrir assistente financeiro"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {open ? (
          <span aria-hidden="true">✕</span>
        ) : (
          <span aria-hidden="true">💬</span>
        )}
      </button>

      {/* Painel de chat */}
      {open && (
        <div
          className="ai-chat-panel"
          role="dialog"
          aria-label="Assistente financeiro"
          aria-modal="false"
        >
          {/* Header */}
          <div className="ai-chat-header">
            <span className="ai-chat-title">Assistente Financeiro</span>
            <button
              className="ai-chat-clear"
              onClick={handleClear}
              aria-label="Limpar conversa"
              title="Limpar conversa"
            >
              Limpar
            </button>
          </div>

          {/* Mensagens */}
          <div className="ai-chat-messages" aria-live="polite" aria-atomic="false">
            {messages.length === 0 && !loading && (
              <p className="ai-chat-empty">
                Olá! Pergunte sobre seus gastos, receitas ou orçamento.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-chat-bubble ai-chat-bubble--${msg.role}`}
              >
                {/* SEC-002: textContent implícito via children — nunca dangerouslySetInnerHTML */}
                <p className="ai-chat-bubble-text">{msg.content}</p>
              </div>
            ))}
            {loading && (
              <div className="ai-chat-bubble ai-chat-bubble--assistant ai-chat-bubble--typing">
                <span className="ai-chat-typing-dot" />
                <span className="ai-chat-typing-dot" />
                <span className="ai-chat-typing-dot" />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="ai-chat-input-row">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre suas finanças…"
              rows={2}
              maxLength={500}
              disabled={loading}
              aria-label="Mensagem para o assistente"
            />
            <button
              className="ai-chat-send"
              onClick={handleSend}
              disabled={loading || input.trim().length < 2}
              aria-label="Enviar mensagem"
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
