"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

import type { TemplateProps } from "../types";
import { Typewriter } from "./Typewriter";
import { useCanAnimate3d } from "./useCanAnimate3d";

// Three.js — только через dynamic import, не в общем бандле (AGENTS.md §2).
const HeartsBackground = dynamic(() => import("./HeartsBackground"), { ssr: false });

const DEFAULT_ENDING_QUESTION = "Ты будешь со мной?";

/**
 * «Признание в любви» (love_its_easy.md §6): печатная машинка на фоне
 * 3D-сердец. Фолбэк на CSS-анимацию при prefers-reduced-motion или
 * отсутствии WebGL. После текста — финальный вопрос (задаёт создатель
 * квеста, есть дефолт) с кнопкой "Да" и праздничным ответом — признание
 * без ответной реакции обрывалось на моргающем курсоре.
 */
export default function PriznanieVLyubvi({ page }: TemplateProps) {
  const canAnimate3d = useCanAnimate3d();
  const lines = (page.groups.lines ?? []).map((item) => item.fields.text).filter(Boolean);
  const endingQuestion = page.fields.endingQuestion || DEFAULT_ENDING_QUESTION;

  const [typingDone, setTypingDone] = useState(false);
  const [answered, setAnswered] = useState(false);

  function handleYes() {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    setAnswered(true);
  }

  return (
    <div className="relative flex min-h-[70vh] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-rose-50 to-white px-4 py-16 dark:from-rose-950 dark:to-zinc-950">
      {canAnimate3d ? (
        <HeartsBackground />
      ) : (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-[float_6s_ease-in-out_infinite] text-2xl text-rose-300"
              style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${i * 0.4}s` }}
            >
              ♥
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">Признание</p>
        <Typewriter lines={lines} onDone={() => setTypingDone(true)} />

        <AnimatePresence mode="wait">
          {answered ? (
            <motion.div
              key="celebrate"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-5xl" aria-hidden>
                🎉
              </span>
              <p className="text-xl font-semibold text-rose-500">Ура! Дальше — только вместе 💕</p>
            </motion.div>
          ) : (
            typingDone && (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="text-5xl text-rose-500"
                  aria-hidden
                >
                  ♥
                </motion.span>
                <p className="text-xl font-semibold">{endingQuestion}</p>
                <button
                  type="button"
                  onClick={handleYes}
                  className="flex h-14 items-center justify-center rounded-full bg-rose-500 px-10 text-lg font-medium text-white transition-colors hover:bg-rose-600"
                >
                  Да 💕
                </button>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
