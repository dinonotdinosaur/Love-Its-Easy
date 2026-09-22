"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { TemplateProps } from "../types";

/**
 * «Выбери свидание» (love_its_easy.md §6): опрос с "убегающей кнопкой"
 * ответа "Нет" и финальной картой с вариантами свидания. Кнопка "Нет"
 * при попытке нажать перепрыгивает в случайное место внутри контейнера —
 * работает одинаково для курсора и тапа, что важно Mobile First.
 */
export default function VyberiSvidanie({ page }: TemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);
  const [dodges, setDodges] = useState(0);
  const [answered, setAnswered] = useState(false);

  const question = page.fields.question || "Пойдёшь со мной на свидание?";
  const dateOptions = page.groups.dateOptions ?? [];

  function dodgeNoButton() {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const buttonWidth = 120;
    const buttonHeight = 48;
    setNoPos({
      x: Math.random() * Math.max(width - buttonWidth, 0),
      y: Math.random() * Math.max(height - buttonHeight, 0),
    });
    setDodges((d) => d + 1);
  }

  if (answered) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h1 className="text-2xl font-bold sm:text-3xl">Ура! Выбирай, куда идём 🎉</h1>
        </motion.div>
        <div className="flex w-full flex-col gap-3">
          {dateOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border border-rose-200 bg-white p-4 text-left dark:border-rose-900 dark:bg-zinc-900"
            >
              <p className="font-semibold">{option.fields.title}</p>
              {option.fields.description && (
                <p className="mt-1 text-sm text-zinc-500">{option.fields.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-[70vh] min-h-[420px] w-full max-w-xl flex-col items-center gap-10 overflow-hidden px-4 py-16 text-center"
    >
      <h1 className="text-2xl font-bold sm:text-3xl">{question}</h1>

      <button
        type="button"
        onClick={() => setAnswered(true)}
        className="flex h-14 items-center justify-center rounded-full bg-rose-500 px-8 text-lg font-medium text-white transition-colors hover:bg-rose-600"
      >
        Да
      </button>

      <motion.button
        type="button"
        onClick={dodgeNoButton}
        onMouseEnter={dodgeNoButton}
        animate={noPos ? { position: "absolute", left: noPos.x, top: noPos.y } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex h-14 items-center justify-center rounded-full border border-black/10 px-8 text-lg font-medium dark:border-white/20"
      >
        Нет
      </motion.button>

      <AnimatePresence>
        {dodges >= 3 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-zinc-500"
          >
            Кажется, «нет» не вариант 😉
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
