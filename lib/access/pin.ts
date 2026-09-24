import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db/client";

/** Сверка введённого PIN с хэшем из `Order.pinCodeHash` (AGENTS.md §4). */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// 4-значный PIN — всего 10 000 вариантов, без ограничения попыток он
// перебирается скриптом за минуты. После MAX_ATTEMPTS неудач подряд заказ
// блокируется; каждая следующая блокировка вдвое длиннее (до потолка).
const MAX_ATTEMPTS = 5;
const BASE_LOCK_MS = 15 * 60 * 1000;
const MAX_LOCK_MS = 24 * 60 * 60 * 1000;

function lockDurationMs(previousLockouts: number): number {
  return Math.min(BASE_LOCK_MS * 2 ** previousLockouts, MAX_LOCK_MS);
}

export type PinCheckResult =
  | { status: "ok" }
  | { status: "invalid" }
  | { status: "locked"; retryAfterSeconds: number };

/**
 * Проверка PIN заказа с защитой от перебора. Попытка сначала атомарно
 * "резервируется" в БД (инкремент счётчика с условием), и только потом
 * идёт сравнение bcrypt — иначе параллельные запросы успевали бы пройти
 * проверку лимита до того, как хоть один из них запишет неудачу.
 */
export async function checkOrderPin(
  order: { id: string; pinCodeHash: string; pinLockouts: number },
  pin: string,
): Promise<PinCheckResult> {
  const now = new Date();

  const reserved = await prisma.order.updateMany({
    where: {
      id: order.id,
      pinFailedAttempts: { lt: MAX_ATTEMPTS },
      OR: [{ pinLockedUntil: null }, { pinLockedUntil: { lte: now } }],
    },
    data: { pinFailedAttempts: { increment: 1 } },
  });

  if (reserved.count === 0) {
    // Либо блокировка уже действует, либо лимит исчерпан, а блокировка ещё
    // не выставлена (параллельные запросы в процессе, или процесс упал между
    // резервированием и записью блокировки). Во втором случае ставим её
    // сами — иначе счётчик "застрял" бы на лимите и заказ заблокировался навсегда.
    await lockIfExhausted(order, now);
    const current = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { pinLockedUntil: true },
    });
    const lockedMs = (current.pinLockedUntil?.getTime() ?? 0) - now.getTime();
    return { status: "locked", retryAfterSeconds: Math.max(Math.ceil(lockedMs / 1000), 1) };
  }

  if (await verifyPin(pin, order.pinCodeHash)) {
    await prisma.order.update({
      where: { id: order.id },
      data: { pinFailedAttempts: 0, pinLockouts: 0, pinLockedUntil: null },
    });
    return { status: "ok" };
  }

  // Неудача уже засчитана резервированием — если она была последней
  // допустимой, ставим блокировку.
  await lockIfExhausted(order, now);
  return { status: "invalid" };
}

/**
 * Ставит блокировку, если лимит попыток исчерпан и блокировка ещё не
 * действует. Условие в `where` не даёт параллельным запросам выставить
 * её несколько раз (после первой счётчик уже сброшен в 0).
 */
async function lockIfExhausted(order: { id: string; pinLockouts: number }, now: Date) {
  await prisma.order.updateMany({
    where: {
      id: order.id,
      pinFailedAttempts: { gte: MAX_ATTEMPTS },
      OR: [{ pinLockedUntil: null }, { pinLockedUntil: { lte: now } }],
    },
    data: {
      pinFailedAttempts: 0,
      pinLockouts: { increment: 1 },
      pinLockedUntil: new Date(now.getTime() + lockDurationMs(order.pinLockouts)),
    },
  });
}
