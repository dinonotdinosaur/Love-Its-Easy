"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

import type { TemplateProps } from "../types";

const FEEDBACK_DELAY_MS = 700;

/** «Ты против меня» (Квиз, love_its_easy.md §6): 5 вопросов, подсчёт очков, конфетти при победе. */
export default function TyProtivMenya({ page, onComplete }: TemplateProps) {
  const title = page.fields.title || "Ты против меня";
  const questions = page.groups.questions ?? [];

  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<"A" | "B" | null>(null);
  const [finished, setFinished] = useState(false);

  const won = finished && questions.length > 0 && score >= Math.ceil(questions.length / 2);

  useEffect(() => {
    if (finished) onComplete?.();
    if (won) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    }
  }, [finished, won, onComplete]);

  function answer(choice: "A" | "B") {
    if (selected) return;
    setSelected(choice);

    const question = questions[step];
    if (question?.fields.correctOption === choice) {
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      setSelected(null);
      if (step + 1 < questions.length) {
        setStep((s) => s + 1);
      } else {
        setFinished(true);
      }
    }, FEEDBACK_DELAY_MS);
  }

  if (finished) {
    const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="text-6xl"
          aria-hidden
        >
          {won ? "🏆" : "💛"}
        </motion.span>
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold"
        >
          {won ? "Ты знаешь меня отлично! 🎉" : "Неплохо, но есть куда расти 😉"}
        </motion.h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Результат: {score} из {questions.length} ({percent}%)
        </p>
      </div>
    );
  }

  const question = questions[step];

  function optionClassName(choice: "A" | "B") {
    const base = "rounded-2xl border p-4 text-left transition-colors";
    if (!selected) {
      return `${base} border-rose-200 bg-white hover:border-rose-400 dark:border-rose-900 dark:bg-zinc-900`;
    }
    const isCorrectOption = question?.fields.correctOption === choice;
    if (isCorrectOption) {
      return `${base} border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40`;
    }
    if (selected === choice) {
      return `${base} border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/40`;
    }
    return `${base} border-rose-100 bg-white opacity-50 dark:border-rose-950 dark:bg-zinc-900`;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full transition-colors ${
                i < step ? "bg-rose-500" : i === step ? "bg-rose-300" : "bg-rose-100 dark:bg-rose-950"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {question && (
          <motion.div
            key={step}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            <p className="text-center text-lg font-medium">{question.fields.question}</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={selected !== null}
                onClick={() => answer("A")}
                className={optionClassName("A")}
              >
                {question.fields.optionA}
              </button>
              <button
                type="button"
                disabled={selected !== null}
                onClick={() => answer("B")}
                className={optionClassName("B")}
              >
                {question.fields.optionB}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
