"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PinForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/access/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, pin }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Неверный PIN");
      }

      // Cookie установлена ответом — обновляем страницу, чтобы сервер
      // заново решил, показывать контент (AGENTS.md §4: проверка серверная).
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неверный PIN");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Эта ссылка защищена PIN-кодом</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="0000"
          autoFocus
          className="rounded-lg border border-black/10 bg-white px-3 py-3 text-center text-2xl tracking-[0.5em] dark:border-white/15 dark:bg-white/5"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || pin.length !== 4}
          className="flex h-12 items-center justify-center rounded-full bg-rose-500 px-5 font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
        >
          {submitting ? "Проверяем…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
