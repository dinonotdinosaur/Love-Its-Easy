import Link from "next/link";
import { notFound } from "next/navigation";

import { PREVIEW_CONTENT } from "@/app/preview/mock-content";
import { prisma } from "@/lib/db/client";
import { isOrderContent } from "@/lib/order-content";
import { PRISMA_TARIFF_TO_TARIFF_ID } from "@/lib/tariffs";
import { TEMPLATE_COMPONENTS } from "@/templates";

/**
 * Публичная Shareable Demo (love_its_easy.md §5) — ссылка, которую можно
 * без опаски пересылать кому угодно. AGENTS.md §7 (жёсткая граница):
 * реальные фото/тексты пользователя сюда никогда не попадают — берём
 * только слаги шаблонов из настоящего заказа, а сам контент — заглушечный
 * (`PREVIEW_CONTENT`, тот же, что у `/preview`), анимация и логика при
 * этом настоящие. Не требует PIN и не проверяет срок ссылки — это
 * маркетинговая копия, а не сам подарок.
 */
export default async function DemoPage({ params }: PageProps<"/demo/[uuid]">) {
  const { uuid } = await params;

  const order = await prisma.order.findUnique({ where: { id: uuid } });
  if (!order || order.status !== "PAID" || !isOrderContent(order.content)) {
    notFound();
  }

  const tariffId = PRISMA_TARIFF_TO_TARIFF_ID[order.tariff];

  return (
    <div className="flex flex-col gap-12 py-8">
      <p className="mx-auto max-w-xl px-4 text-center text-xs uppercase tracking-widest text-zinc-400">
        Демо-версия — без личных фото и текстов
      </p>

      {order.content.pages.map((page, index) => {
        const slug = page.templateSlug as keyof typeof TEMPLATE_COMPONENTS;
        const Component = TEMPLATE_COMPONENTS[slug];
        const demoContent = PREVIEW_CONTENT[slug];
        if (!Component || !demoContent) return null;

        return (
          <section key={index}>
            <Component page={demoContent} />
          </section>
        );
      })}

      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-4 py-8 text-center">
        <p className="text-lg font-medium">Хочешь такой же сюрприз?</p>
        <Link
          href={`/order/${tariffId}`}
          className="flex h-12 items-center justify-center rounded-full bg-rose-500 px-8 font-medium text-white transition-colors hover:bg-rose-600"
        >
          Создать такой же сюрприз
        </Link>
      </div>
    </div>
  );
}
