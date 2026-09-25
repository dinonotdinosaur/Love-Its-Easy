import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/client";
import { collectPhotoKeys, isOrderContent } from "@/lib/order-content";
import { deleteUserPhotos, listUploadedPhotosBefore } from "@/lib/storage/s3";

// Фото загружается до создания заказа, поэтому брошенные формы оставляют
// в S3 файлы, на которые не ссылается ни один заказ. Сутки запаса — чтобы
// не удалить фото у того, кто ещё заполняет форму.
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * Удаляет из S3 загруженные фото, на которые не ссылается ни один заказ.
 * Запускается cron'ом на VPS раз в сутки (см. DEPLOY.md). `?dryRun=1` —
 * только показать, что было бы удалено.
 *
 * Фото из заказов в ЛЮБОМ статусе не трогаем, включая MODERATION_FAILED —
 * они нужны для калибровки порогов NudeNet (AGENTS.md §8.2).
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";

  // Сначала список файлов, потом ссылки из заказов: заказ, созданный между
  // этими шагами, попадёт в ссылки и защитит свои фото.
  const candidates = await listUploadedPhotosBefore(new Date(Date.now() - GRACE_PERIOD_MS));

  const orders = await prisma.order.findMany({ select: { id: true, content: true } });
  const referenced = new Set<string>();
  for (const order of orders) {
    if (!isOrderContent(order.content)) {
      // Не можем прочитать ссылки заказа — значит, не знаем, какие фото
      // "ничьи". Безопаснее не удалять ничего.
      return NextResponse.json(
        { error: `Не удалось разобрать content заказа ${order.id}, очистка отменена` },
        { status: 500 },
      );
    }
    for (const key of collectPhotoKeys(order.content)) referenced.add(key);
  }

  const orphans = candidates.filter((key) => !referenced.has(key));
  if (!dryRun) await deleteUserPhotos(orphans);

  return NextResponse.json({
    dryRun,
    scanned: candidates.length,
    deleted: dryRun ? 0 : orphans.length,
    ...(dryRun && { wouldDelete: orphans }),
  });
}
