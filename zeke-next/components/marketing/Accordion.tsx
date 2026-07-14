"use client";

import { type ReactNode, useState } from "react";

export interface AccordionItem {
  id: string;
  header: ReactNode;
  body: ReactNode;
}

// Generic single-open-at-a-time accordion. Port of the shared open/close
// behavior behind .faq-item/.acc-item/.ls-item in the legacy CSS/JS
// (toggleFaq/toggleAcc/toggleSection all did the same "close all, open the
// clicked one unless it was already open" dance).
export function Accordion({
  items,
  itemClassName = "",
}: {
  items: AccordionItem[];
  itemClassName?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={`mb-2.5 cursor-pointer rounded-2xl border bg-card transition-colors ${
              isOpen ? "border-accent/40" : "border-border hover:border-accent/30"
            } ${itemClassName}`}
            onClick={() => setOpenId(isOpen ? null : item.id)}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-white">
              {item.header}
              <span
                className={`flex-shrink-0 text-lg leading-none text-muted transition-transform ${
                  isOpen ? "rotate-45 text-accent" : ""
                }`}
              >
                +
              </span>
            </div>
            {isOpen && (
              <div className="px-5 pb-4 text-[13.5px] leading-relaxed text-muted">
                {item.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
