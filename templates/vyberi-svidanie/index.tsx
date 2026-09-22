"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { TemplateProps } from "../types";

const NO_BUTTON_SIZE = { width: 120, height: 56 };
const TORMENT_DURATION_MS = 10_000;

const TAUNTS = ["Не поймать! 😏", "Ты серьёзно? 😄", "Всё ещё пытаешься? 😅"];

/**
 * «Выбери свидание» (love_its_easy.md §6): опрос с "убегающей кнопкой"
 * ответа "Нет". Кнопка убегает от курсора/тапа ~10 секунд (можно
 * "помучить" партнёра), не залезая на кнопку "Да", а затем перестаёт
 * реагировать и уступает место финальной карте с вариантами свидания.
 */
export default function VyberiSvidanie({ page }: TemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const startedAtRef = useRef<number | null>(null);

  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);
  const [dodges, setDodges] = useState(0);
  const [teased, setTeased] = useState(false);
  const [answered, setAnswered] = useState(false);

  const question = page.fields.question || "Пойдёшь со мной на свидание?";
  const dateOptions = page.groups.dateOptions ?? [];

  function pickSafePosition(container: HTMLDivElement, avoid: DOMRect | null) {
    const rect = container.getBoundingClientRect();
    const maxX = Math.max(rect.width - NO_BUTTON_SIZE.width, 0);
    const maxY = Math.max(rect.height - NO_BUTTON_SIZE.height, 0);

    for (let attempt = 0; attempt < 20; attempt++) {
      const x = Math.random() * maxX;
      const y = Math.random() * maxY;
      if (
        !avoid ||
        x + NO_BUTTON_SIZE.width < avoid.left ||
        x > avoid.right ||
        y + NO_BUTTON_SIZE.height < avoid.top ||
        y > avoid.bottom
      ) {
        return { x, y };
      }
    }
    return { x: 0, y: 0 };
  }

  function dodgeNoButton() {
    if (teased) return;
    const container = containerRef.current;
    if (!container) return;

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
    if (Date.now() - startedAtRef.current >= TORMENT_DURATION_MS) {
      setTeased(true);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const yesRect = yesButtonRef.current?.getBoundingClientRect() ?? null;
    const avoidRect = yesRect
      ? new DOMRect(
          yesRect.left - containerRect.left - 16,
          yesRect.top - containerRect.top - 16,
          yesRect.width + 32,
          yesRect.height + 32,
        )
      : null;

    setNoPos(pickSafePosition(container, avoidRect));
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

  const taunt = TAUNTS[Math.min(Math.floor(dodges / 3), TAUNTS.length - 1)];

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-[70vh] min-h-[420px] w-full max-w-xl flex-col items-center gap-10 overflow-hidden px-4 py-16 text-center"
    >
      <h1 className="text-2xl font-bold sm:text-3xl">{question}</h1>

      <button
        ref={yesButtonRef}
        type="button"
        onClick={() => setAnswered(true)}
        className="flex h-14 items-center justify-center rounded-full bg-rose-500 px-8 text-lg font-medium text-white transition-colors hover:bg-rose-600"
      >
        Да
      </button>

      <motion.button
        type="button"
        disabled={teased}
        onClick={dodgeNoButton}
        onMouseEnter={dodgeNoButton}
        animate={noPos ? { position: "absolute", left: noPos.x, top: noPos.y } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`flex h-14 items-center justify-center rounded-full border px-8 text-lg font-medium transition-opacity ${
          teased
            ? "border-black/10 text-zinc-400 dark:border-white/10 dark:text-zinc-600"
            : "border-black/10 dark:border-white/20"
        }`}
      >
        Нет
      </motion.button>

      <AnimatePresence mode="wait">
        {teased ? (
          <motion.p
            key="teased"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-medium text-rose-500"
          >
            Кажется, «нет» не вариант 😉
          </motion.p>
        ) : (
          dodges >= 3 && (
            <motion.p
              key="taunt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-zinc-500"
            >
              {taunt}
            </motion.p>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
