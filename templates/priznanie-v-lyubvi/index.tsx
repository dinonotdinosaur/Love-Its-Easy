"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

import type { TemplateProps } from "../types";
import { Typewriter } from "./Typewriter";
import { useCanAnimate3d } from "./useCanAnimate3d";

// Three.js — только через dynamic import, не в общем бандле (AGENTS.md §2).
const HeartsBackground = dynamic(() => import("./HeartsBackground"), { ssr: false });

/**
 * «Признание в любви» (love_its_easy.md §6): печатная машинка на фоне
 * 3D-сердец. Фолбэк на CSS-анимацию при prefers-reduced-motion или
 * отсутствии WebGL. После последней строки — финальный аккорд (пульсирующее
 * сердце), чтобы страница не обрывалась на моргающем курсоре.
 */
export default function PriznanieVLyubvi({ page }: TemplateProps) {
  const canAnimate3d = useCanAnimate3d();
  const lines = (page.groups.lines ?? []).map((item) => item.fields.text).filter(Boolean);
  const [finished, setFinished] = useState(false);

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
        <Typewriter lines={lines} onDone={() => setFinished(true)} />
        {finished && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: [1, 1.15, 1] }}
            transition={{ opacity: { duration: 0.4 }, scale: { duration: 1.6, repeat: Infinity } }}
            className="text-5xl text-rose-500"
            aria-hidden
          >
            ♥
          </motion.span>
        )}
      </div>
    </div>
  );
}
