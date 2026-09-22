"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";

import type { ResolvedGroupItemContent } from "@/lib/order-content";

import { ClockTimePicker, type ClockTime } from "./ClockTimePicker";
import type { TemplateProps } from "../types";

const NO_BUTTON_SIZE = { width: 120, height: 56 };
const TORMENT_DURATION_MS = 10_000;
/** Курсор ближе этого расстояния до центра кнопки — считаем, что "подкрадываются". */
const DANGER_RADIUS_PX = 90;
/** Не даём убегать чаще этого интервала — иначе на быстром движении мыши будет дёргано. */
const MIN_DODGE_INTERVAL_MS = 300;

const TAUNTS = ["Не поймать! 😏", "Ты серьёзно? 😄", "Всё ещё пытаешься? 😅"];
/** Насколько вырастает кнопка "Да" к концу времени "мучений" (1 = без роста). */
const YES_MAX_SCALE = 1.4;
const DEFAULT_FINAL_MESSAGE = "Жду тебя! 💕";

/** После "Да": выбор варианта → удобные дата/время → финальное сообщение. */
function PostAnswerFlow({
  dateOptions,
  finalMessage,
}: {
  dateOptions: ResolvedGroupItemContent[];
  finalMessage: string;
}) {
  const [chosenIndex, setChosenIndex] = useState<number | null>(dateOptions.length > 0 ? null : -1);
  const [date, setDate] = useState("");
  const [clockTime, setClockTime] = useState<ClockTime>({ hour: 19, minute: 0 });
  const [done, setDone] = useState(false);

  const time = `${String(clockTime.hour).padStart(2, "0")}:${String(clockTime.minute).padStart(2, "0")}`;

  function handleConfirmSchedule(event: React.FormEvent) {
    event.preventDefault();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    setDone(true);
  }

  if (done) {
    const chosen = chosenIndex !== null && chosenIndex >= 0 ? dateOptions[chosenIndex] : null;
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-4 py-16 text-center"
      >
        <span className="text-5xl" aria-hidden>
          🎉
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">{finalMessage}</h1>
        {(chosen ?? date) && (
          <p className="text-zinc-600 dark:text-zinc-400">
            {chosen?.fields.title}
            {chosen && date && " — "}
            {date && new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU")}
            {time && `, ${time}`}
          </p>
        )}
      </motion.div>
    );
  }

  if (chosenIndex !== null) {
    return (
      <form
        onSubmit={handleConfirmSchedule}
        className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-16 text-center"
      >
        <h1 className="text-2xl font-bold sm:text-3xl">Когда удобно?</h1>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-center dark:border-white/15 dark:bg-white/5"
          />
        </div>
        <ClockTimePicker value={clockTime} onChange={setClockTime} />
        <button
          type="submit"
          className="flex h-12 items-center justify-center rounded-full bg-rose-500 px-8 font-medium text-white transition-colors hover:bg-rose-600"
        >
          Готово
        </button>
      </form>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <h1 className="text-2xl font-bold sm:text-3xl">Ура! Выбирай, куда идём 🎉</h1>
      </motion.div>
      <div className="flex w-full flex-col gap-3">
        {dateOptions.map((option, index) => (
          <motion.button
            key={index}
            type="button"
            onClick={() => setChosenIndex(index)}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-rose-200 bg-white p-4 text-left transition-colors hover:border-rose-400 dark:border-rose-900 dark:bg-zinc-900"
          >
            <p className="font-semibold">{option.fields.title}</p>
            {option.fields.description && (
              <p className="mt-1 text-sm text-zinc-500">{option.fields.description}</p>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/**
 * «Выбери свидание» (love_its_easy.md §6): опрос с "убегающей кнопкой"
 * ответа "Нет". Кнопка чувствует приближение курсора/пальца (не только
 * прямое попадание) и убегает от него ~10 секунд подряд, не залезая на
 * заголовок и кнопку "Да" (запретная зона — вся верхняя полоса контейнера),
 * а затем перестаёт реагировать и уступает место выбору варианта свидания.
 *
 * После "Да": клик по варианту (реально выбирается, не просто список) →
 * дата и время → финальное сообщение (задаёт создатель квеста, есть дефолт).
 *
 * Кнопка "Да" плавно растёт, пока идут "мучения" (до `YES_MAX_SCALE` к концу
 * `TORMENT_DURATION_MS`) — лёгкая подсказка в сторону "правильного" ответа.
 *
 * Позиция анимируется через `x`/`y` (transform), а не `left`/`top`: если
 * смешать в одном `animate`-объекте неанимируемое свойство `position` с
 * числовыми `left`/`top`, Framer Motion после нескольких вызовов перестаёт
 * реагировать на новые целевые координаты — воспроизведено и подтверждено
 * вручную (кнопка "залипала" на месте, хотя React-состояние обновлялось).
 */
export default function VyberiSvidanie({ page }: TemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const lastDodgeAtRef = useRef(0);
  const growIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [noOffset, setNoOffset] = useState<{ x: number; y: number } | null>(null);
  const [dodges, setDodges] = useState(0);
  const [teased, setTeased] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [yesScale, setYesScale] = useState(1);

  // На случай размонтирования компонента посреди "мучений".
  useEffect(() => {
    return () => {
      if (growIntervalRef.current) clearInterval(growIntervalRef.current);
    };
  }, []);

  const question = page.fields.question || "Пойдёшь со мной на свидание?";
  const finalMessage = page.fields.finalMessage || DEFAULT_FINAL_MESSAGE;
  const dateOptions = page.groups.dateOptions ?? [];

  const pickSafeOffset = useCallback((container: HTMLDivElement, forbiddenBottomY: number) => {
    const rect = container.getBoundingClientRect();
    const maxX = Math.max(rect.width - NO_BUTTON_SIZE.width, 0);
    const minY = Math.min(forbiddenBottomY, Math.max(rect.height - NO_BUTTON_SIZE.height, 0));
    const maxY = Math.max(rect.height - NO_BUTTON_SIZE.height, minY);

    return {
      x: Math.random() * maxX,
      y: minY + Math.random() * (maxY - minY),
    };
  }, []);

  const dodgeNoButton = useCallback(() => {
    if (teased) return;
    const container = containerRef.current;
    if (!container) return;

    const now = Date.now();
    if (now - lastDodgeAtRef.current < MIN_DODGE_INTERVAL_MS) return;

    if (startedAtRef.current === null) {
      startedAtRef.current = now;
      const startedAt = now;
      growIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const ratio = Math.min(elapsed / TORMENT_DURATION_MS, 1);
        setYesScale(1 + ratio * (YES_MAX_SCALE - 1));
        if (ratio >= 1 && growIntervalRef.current) {
          clearInterval(growIntervalRef.current);
          growIntervalRef.current = null;
        }
      }, 200);
    }
    if (now - startedAtRef.current >= TORMENT_DURATION_MS) {
      setTeased(true);
      return;
    }

    lastDodgeAtRef.current = now;

    const containerRect = container.getBoundingClientRect();
    // Запретная зона — вся полоса от верха контейнера до низа кнопки "Да"
    // (с запасом), а не только рамка вокруг "Да": так кнопка "Нет" не может
    // оказаться и на заголовке-вопросе, который всегда выше "Да".
    const yesRect = yesButtonRef.current?.getBoundingClientRect();
    const forbiddenBottomY = yesRect ? yesRect.bottom - containerRect.top + 16 : 0;

    setNoOffset(pickSafeOffset(container, forbiddenBottomY));
    setDodges((d) => d + 1);
  }, [teased, pickSafeOffset]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (teased) return;
    const noButton = noButtonRef.current;
    if (!noButton) return;

    const buttonRect = noButton.getBoundingClientRect();
    const distance = Math.hypot(
      event.clientX - (buttonRect.left + buttonRect.width / 2),
      event.clientY - (buttonRect.top + buttonRect.height / 2),
    );

    if (distance < DANGER_RADIUS_PX) {
      dodgeNoButton();
    }
  }

  if (answered) {
    return <PostAnswerFlow dateOptions={dateOptions} finalMessage={finalMessage} />;
  }

  const taunt = TAUNTS[Math.min(Math.floor(dodges / 3), TAUNTS.length - 1)];

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative mx-auto flex h-[70vh] min-h-[420px] w-full max-w-xl flex-col items-center gap-10 overflow-hidden px-4 py-16 text-center"
    >
      <h1 className="text-2xl font-bold sm:text-3xl">{question}</h1>

      <motion.button
        ref={yesButtonRef}
        type="button"
        onClick={() => setAnswered(true)}
        animate={{ scale: yesScale }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-14 items-center justify-center rounded-full bg-rose-500 px-8 text-lg font-medium text-white transition-colors hover:bg-rose-600"
      >
        Да
      </motion.button>

      <motion.button
        ref={noButtonRef}
        type="button"
        disabled={teased}
        onPointerDown={dodgeNoButton}
        style={noOffset ? { position: "absolute", left: 0, top: 0 } : undefined}
        animate={noOffset ? { x: noOffset.x, y: noOffset.y } : undefined}
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
