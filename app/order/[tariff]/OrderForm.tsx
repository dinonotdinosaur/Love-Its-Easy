"use client";

import { useState } from "react";

import { CONSENT_TEXT } from "@/lib/consent";
import { makeEmptyPageContent, type OrderContent, type PageContent } from "@/lib/order-content";
import type { TariffConfig, TemplateSlug } from "@/lib/tariffs";

import { TemplatePageForm } from "./TemplatePageForm";

export function OrderForm({
  tariff,
  allowedTemplates,
}: {
  tariff: TariffConfig;
  allowedTemplates: TemplateSlug[];
}) {
  const [email, setEmail] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [pages, setPages] = useState<PageContent[]>(() =>
    Array.from({ length: tariff.pageCount }, () => makeEmptyPageContent(allowedTemplates[0])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<string[]>([]);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const photosAllowed = tariff.maxPhotos > 0;

  function updatePage(index: number, page: PageContent) {
    setPages((prev) => prev.map((p, i) => (i === index ? page : p)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFailures([]);
    setSubmitting(true);

    try {
      const content: OrderContent = { pages };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tariffId: tariff.id, email, content, consentGiven }),
      });
      const data = (await res.json()) as { orderId?: string; error?: string; failures?: string[] };

      if (res.status === 422 && data.failures) {
        setFailures(data.failures);
        return;
      }
      if (!res.ok || !data.orderId) {
        throw new Error(data.error ?? "Не удалось отправить заказ");
      }
      setSuccessOrderId(data.orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить заказ");
    } finally {
      setSubmitting(false);
    }
  }

  if (successOrderId) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center dark:border-emerald-700 dark:bg-emerald-950/30">
        <p className="font-semibold">Заказ прошёл модерацию</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Номер заказа: {successOrderId}. Дальше — оплата, это появится совсем скоро.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {pages.map((page, index) => (
        <TemplatePageForm
          key={index}
          label={tariff.pageCount > 1 ? `Страница ${index + 1}` : undefined}
          allowedTemplates={allowedTemplates}
          page={page}
          onChange={(p) => updatePage(index, p)}
          photosAllowed={photosAllowed}
          consentGiven={consentGiven}
        />
      ))}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email для получения ссылки
          <span className="text-rose-500"> *</span>
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        />
      </div>

      {photosAllowed && (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="mt-0.5"
          />
          {CONSENT_TEXT}
        </label>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {failures.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          <p className="font-medium">Автоматическая модерация не пройдена:</p>
          <ul className="mt-1 list-disc pl-5">
            {failures.map((failure) => (
              <li key={failure}>{failure}</li>
            ))}
          </ul>
          <p className="mt-2">Замените отмеченные фото или текст и отправьте ещё раз.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 items-center justify-center rounded-full bg-rose-500 px-5 font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
      >
        {submitting ? "Отправляем…" : "Продолжить"}
      </button>
    </form>
  );
}
