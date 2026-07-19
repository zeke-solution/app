"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/actions/chat";
import { fmtDate } from "@/lib/domain/format";

export interface ChatMessage {
  id?: string;
  sender_id: string | null;
  msg_type: string | null;
  content: string;
  created_at: string | null;
}

// The one genuinely realtime piece of the app (plan section 3.4). Server
// Component fetches initialMessages for a fast first paint; this client
// component seeds from that, then opens a browser Supabase client in a
// useEffect keyed on dealId to subscribe to new inserts — a 1:1 port of
// creator.js's _subscribeChat()/_appendMsg().
export function ChatThread({
  dealId,
  currentUserId,
  counterpartLabel,
  initialMessages = [],
}: {
  dealId: string;
  currentUserId: string;
  counterpartLabel: string;
  initialMessages?: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    // Capture the channel in a local variable (not module/ref-shared) so
    // Strict Mode's double-invoke in dev removes the exact instance this
    // effect run created, not a stale one — see plan section 6.4.
    const channel = supabase
      .channel(`chat:${dealId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "deal_messages", filter: `deal_id=eq.${dealId}` },
        (payload) => {
          const row = payload.new as ChatMessage;
          if (row.sender_id !== currentUserId) setMessages((prev) => [...prev, row]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { sender_id: currentUserId, msg_type: "text", content: text, created_at: new Date().toISOString() },
    ]);
    const res = await sendMessage(dealId, text);
    if (!res.ok) console.error("chat send failed:", res.error);
  }

  return (
    <div className="flex h-[calc(100vh-220px)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.map((m, i) => {
          if (m.msg_type === "event" || m.msg_type === "event_gold") {
            return (
              <div key={m.id ?? i} className="flex justify-center">
                <div
                  className={`rounded-[10px] border px-4 py-2 text-[11px] font-semibold ${
                    m.msg_type === "event_gold"
                      ? "border-gold/20 bg-gold/[0.06] text-gold"
                      : "border-zgreen/20 bg-zgreen/[0.06] text-zgreen"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          }
          const isMe = m.sender_id === currentUserId;
          return (
            <div key={m.id ?? i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl border px-3.5 py-2.5 ${
                  isMe
                    ? "rounded-br-md border-accent/20 bg-accent/[0.12]"
                    : "rounded-bl-md border-border bg-navy"
                }`}
              >
                <div className="text-[13px] text-light">{m.content}</div>
                <div className="mt-1 text-[10px] text-muted">
                  {isMe ? "You" : counterpartLabel} · {fmtDate(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 border-t border-border pt-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-border bg-navy px-3.5 py-2 text-[13px] text-light outline-none"
          />
          <button
            onClick={handleSend}
            className="brand-button-primary rounded-xl border px-4 py-2 text-[13px] font-bold text-white"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
