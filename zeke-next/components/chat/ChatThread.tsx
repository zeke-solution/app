'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sendMessage } from '@/actions/chat';
import { fmtDate } from '@/lib/domain/format';

export interface ChatMessage {
  id?: string;
  sender_id: string | null;
  msg_type: string | null;
  content: string;
  created_at: string | null;
}

export function ChatThread({
  dealId,
  currentUserId,
  counterpartLabel,
  initialMessages = [],
  canSend = true,
  blockedMessage = 'Messaging is unavailable.',
}: {
  dealId: string;
  currentUserId: string;
  counterpartLabel: string;
  initialMessages?: ChatMessage[];
  canSend?: boolean;
  blockedMessage?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('chat:' + dealId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deal_messages',
          filter: 'deal_id=eq.' + dealId,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          if (row.sender_id !== currentUserId) {
            setMessages((current) => [...current, row]);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [dealId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !canSend) return;
    setError('');
    setInput('');
    const optimisticId = 'pending-' + Date.now();
    setMessages((current) => [
      ...current,
      {
        id: optimisticId,
        sender_id: currentUserId,
        msg_type: 'text',
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);
    const result = await sendMessage(dealId, text);
    if (!result.ok) {
      setMessages((current) =>
        current.filter((message) => message.id !== optimisticId),
      );
      setInput(text);
      setError(result.error);
    }
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-4'>
        {messages.map((message, index) => {
          if (
            message.msg_type === 'event' ||
            message.msg_type === 'event_gold'
          ) {
            return (
              <div key={message.id ?? index} className='flex justify-center'>
                <div
                  className={
                    'rounded-[10px] border px-4 py-2 text-[11px] font-semibold ' +
                    (message.msg_type === 'event_gold'
                      ? 'border-gold/20 bg-gold/[0.06] text-gold'
                      : 'border-zgreen/20 bg-zgreen/[0.06] text-zgreen')
                  }
                >
                  {message.content}
                </div>
              </div>
            );
          }
          const isMe = message.sender_id === currentUserId;
          return (
            <div
              key={message.id ?? index}
              className={'flex ' + (isMe ? 'justify-end' : 'justify-start')}
            >
              <div
                className={
                  'max-w-[82%] rounded-2xl border px-3.5 py-2.5 ' +
                  (isMe
                    ? 'rounded-br-md border-accent/20 bg-accent/[0.12]'
                    : 'rounded-bl-md border-border bg-navy')
                }
              >
                <div className='whitespace-pre-wrap break-words text-[13px] text-light'>
                  {message.content}
                </div>
                <div className='mt-1 text-[10px] text-muted'>
                  {isMe ? 'You' : counterpartLabel} -{' '}
                  {fmtDate(message.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className='z-20 flex-shrink-0 border-t border-border bg-dark pt-3 pb-0.5'>
        {!canSend ? (
          <div className='rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-xs font-semibold text-gold'>
            {blockedMessage}
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <div className='flex items-end gap-2'>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder='Type a message'
                aria-label='Message'
                className='min-w-0 flex-1 rounded-xl border border-border bg-navy px-3.5 py-2.5 text-[13px] text-light outline-none focus:border-accent'
              />
              <button
                type='submit'
                disabled={!input.trim()}
                className='brand-button-primary flex-shrink-0 rounded-xl border px-4 py-2.5 text-[13px] font-bold text-light disabled:opacity-50'
              >
                Send
              </button>
            </div>
            {error && (
              <div className='mt-2 text-xs font-semibold text-danger'>
                {error}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
