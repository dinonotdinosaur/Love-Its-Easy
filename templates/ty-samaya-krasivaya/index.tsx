"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { TemplateProps } from "../types";

const DEFAULT_FINAL_MESSAGE = "И это ещё не все причины, почему я тебя люблю…";

/**
 * «Ты самая красивая» (love_its_easy.md §6): карточки с текстом и фото,
 * анимация раскрытия. Каждая карточка стартует закрытой и переворачивается
 * по тапу/клику. После того как открыты все карточки — финальное сообщение
 * (текст задаёт создатель квеста, поле `finalMessage`).
 */
export default function TySamayaKrasivaya({ page, onComplete }: TemplateProps) {
  const cards = page.groups.cards ?? [];
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const allRevealed = cards.length > 0 && revealed.size === cards.length;

  useEffect(() => {
    if (allRevealed) onComplete?.();
  }, [allRevealed, onComplete]);

  function toggle(index: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="text-center text-2xl font-bold sm:text-3xl">Ты самая красивая</h1>
      <p className="text-center text-sm text-zinc-500">Нажми на карточку, чтобы раскрыть её</p>

      <div className="flex flex-wrap justify-center gap-4">
        {cards.map((card, index) => {
          const isOpen = revealed.has(index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => toggle(index)}
              className="aspect-[3/4] w-32 shrink-0 [perspective:1000px] sm:w-36"
              aria-label={isOpen ? "Скрыть карточку" : "Раскрыть карточку"}
            >
              <motion.div
                className="relative h-full w-full [transform-style:preserve-3d]"
                animate={{ rotateY: isOpen ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-rose-500 text-4xl text-white [backface-visibility:hidden]">
                  ♥
                </div>
                <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-rose-200 bg-white [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-rose-900 dark:bg-zinc-900">
                  {card.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- динамический источник из S3
                    <img src={card.photoUrl} alt="" className="h-1/2 w-full object-cover" />
                  )}
                  <p className="flex flex-1 items-center justify-center p-2 text-center text-xs text-zinc-700 dark:text-zinc-300">
                    {card.fields.text}
                  </p>
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {allRevealed && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-center text-lg font-medium text-rose-500"
          >
            {page.fields.finalMessage || DEFAULT_FINAL_MESSAGE}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
