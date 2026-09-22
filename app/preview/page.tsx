import type { Metadata } from "next";
import Link from "next/link";

import { TEMPLATE_SLUGS, TEMPLATE_TITLES } from "@/lib/tariffs";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Служебная страница для визуальной проверки шаблонов на заглушечных данных (Фаза 8). */
export default function PreviewIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-16">
      <h1 className="text-xl font-bold">Превью шаблонов</h1>
      {TEMPLATE_SLUGS.map((slug) => (
        <Link
          key={slug}
          href={`/preview/${slug}`}
          className="rounded-xl border border-black/10 bg-white px-4 py-3 dark:border-white/15 dark:bg-white/5"
        >
          {TEMPLATE_TITLES[slug]}
        </Link>
      ))}
    </div>
  );
}
