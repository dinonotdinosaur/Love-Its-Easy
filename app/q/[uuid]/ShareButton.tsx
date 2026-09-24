"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/**
 * "Поделиться с подругой" (love_its_easy.md §5) — ведёт не на оригинал
 * (там реальные фото/тексты), а на публичную Shareable Demo (`/demo/[uuid]`,
 * AGENTS.md §7): демо не должно содержать реальные данные пользователя.
 * Поэтому в ссылке `demoId`, а не id заказа — иначе из демо-ссылки
 * восстанавливается адрес настоящего квеста `/q/[uuid]`.
 */
export function ShareButton({ demoId }: { demoId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/demo/${demoId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Смотри, какой сюрприз мне сделали! 🔥", url });
      } catch {
        // Пользователь закрыл системный диалог — не ошибка.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер обмена недоступен (например, нет разрешения) — молча игнорируем.
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-2 px-4 py-8 text-center"
    >
      <button
        type="button"
        onClick={handleShare}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-rose-500 px-6 font-medium text-white transition-colors hover:bg-rose-600"
      >
        🔥 Поделиться с подругой
      </button>
      {copied && <p className="text-sm text-zinc-500">Ссылка скопирована!</p>}
    </motion.div>
  );
}
