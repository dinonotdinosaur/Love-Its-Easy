import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { verifyPinToken, pinCookieName } from "@/lib/access/pin-session";
import { prisma } from "@/lib/db/client";
import { collectPhotoKeys, isOrderContent, resolvePageContentPhotos } from "@/lib/order-content";
import { getSignedPhotoUrl } from "@/lib/storage/s3";

import { PinForm } from "./PinForm";
import { QuestView } from "./QuestView";

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
    if (!verifyPinToken(order.id, order.pinCodeHash, token)) {
      return <PinForm orderId={order.id} />;
    }
  }

  const content = order.content;
  const photoKeys = collectPhotoKeys(content);
  const signedUrls = await Promise.all(photoKeys.map((key) => getSignedPhotoUrl(key)));
  const urlByKey = new Map(photoKeys.map((key, i) => [key, signedUrls[i]]));

  const resolvedPages = content.pages.map((page) =>
    resolvePageContentPhotos(page, (key) => urlByKey.get(key) ?? ""),
  );

  return (
    <QuestView
      pages={resolvedPages}
      demoId={order.demoId}
      multiPage={content.pages.length > 1}
    />
  );
}
