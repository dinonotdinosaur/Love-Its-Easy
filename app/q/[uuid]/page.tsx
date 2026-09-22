import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { verifyPinToken, pinCookieName } from "@/lib/access/pin-session";
import { prisma } from "@/lib/db/client";
import { collectPhotoKeys, isOrderContent, resolvePageContentPhotos } from "@/lib/order-content";
import { getSignedPhotoUrl } from "@/lib/storage/s3";
import { TEMPLATE_COMPONENTS } from "@/templates";

import { PinForm } from "./PinForm";

// Вынесено из компонента: React-компилятор помечает Date.now() в теле
// компонента как "нечистый вызов", хотя для серверного асинхронного
// компонента (рендерится один раз на запрос, не переиспользуется между
// клиентскими ре-рендерами) сравнение с реальным временем на момент
// запроса — ожидаемое и корректное поведение.
function isExpired(expiresAt: Date | null): boolean {
  return expiresAt !== null && expiresAt.getTime() < Date.now();
}

export default async function QuestPage({ params }: PageProps<"/q/[uuid]">) {
  const { uuid } = await params;

  const order = await prisma.order.findUnique({ where: { id: uuid } });

  // Ссылка "не существует" функционально, пока заказ не оплачен и не
  // прошёл модерацию — не отличаем это от "не найдено" наружу.
  if (!order || order.status !== "PAID" || !isOrderContent(order.content)) {
    notFound();
  }

  if (isExpired(order.expiresAt)) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-2 px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Срок действия ссылки истёк</h1>
        <p className="text-sm text-zinc-500">Этот сюрприз был доступен ограниченное время.</p>
      </div>
    );
  }

  if (order.pinCodeHash) {
    const cookieStore = await cookies();
    const token = cookieStore.get(pinCookieName(order.id))?.value;
    if (!verifyPinToken(order.id, token)) {
      return <PinForm orderId={order.id} />;
    }
  }

  const content = order.content;
  const photoKeys = collectPhotoKeys(content);
  const signedUrls = await Promise.all(photoKeys.map((key) => getSignedPhotoUrl(key)));
  const urlByKey = new Map(photoKeys.map((key, i) => [key, signedUrls[i]]));

  const multiPage = content.pages.length > 1;

  return (
    <div className="flex flex-col gap-12 py-8">
      {content.pages.map((page, index) => {
        const Component = TEMPLATE_COMPONENTS[page.templateSlug as keyof typeof TEMPLATE_COMPONENTS];
        if (!Component) return null;

        const resolved = resolvePageContentPhotos(page, (key) => urlByKey.get(key) ?? "");

        return (
          <section key={index} className="flex flex-col gap-4">
            {multiPage && (
              <h2 className="text-center text-sm font-medium uppercase tracking-widest text-zinc-400">
                Страница {index + 1}
              </h2>
            )}
            <Component page={resolved} />
          </section>
        );
      })}
    </div>
  );
}
