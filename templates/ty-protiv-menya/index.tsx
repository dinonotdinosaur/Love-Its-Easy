"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

import type { TemplateProps } from "../types";

/** «Ты против меня» (Квиз, love_its_easy.md §6): 5 вопросов, подсчёт очков, конфетти при победе. */
export default function TyProtivMenya({ page }: TemplateProps) {
  const title = page.fields.title || "Ты против меня";
  const questions = page.groups.questions ?? [];

  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const won = finished && questions.length > 0 && score >= Math.ceil(questions.length / 2);

  useEffect(() => {
    if (won) {
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    }
  }, [won]);

  function answer(choice: "A" | "B") {
    const question = questions[step];
    if (question?.fields.correctOption === choice) {
      setScore((s) => s + 1);
    }
    if (step + 1 < questions.length) {
      setStep((s) => s + 1);
    } else {
      setFinished(true);
    }
  }

  if (finished) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold"
        >
          {won ? "Ты знаешь меня отлично! 🎉" : "Неплохо, но есть куда расти 😉"}
        </motion.h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Результат: {score} из {questions.length}
        </p>
      </div>
    );
  }

  const question = questions[step];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Вопрос {step + 1} из {questions.length}
        </p>
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
                onClick={() => answer("A")}
                className="rounded-2xl border border-rose-200 bg-white p-4 text-left transition-colors hover:border-rose-400 dark:border-rose-900 dark:bg-zinc-900"
              >
                {question.fields.optionA}
              </button>
              <button
                type="button"
                onClick={() => answer("B")}
                className="rounded-2xl border border-rose-200 bg-white p-4 text-left transition-colors hover:border-rose-400 dark:border-rose-900 dark:bg-zinc-900"
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
