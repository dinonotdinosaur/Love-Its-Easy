import { prisma } from "@/lib/db/client";
import { generatePin, hashPin } from "@/lib/payments/pin";
import { getTariff, PRISMA_TARIFF_TO_TARIFF_ID } from "@/lib/tariffs";

export class OrderNotPayableError extends Error {}

export interface FulfillResult {
  orderId: string;
  expiresAt: Date;
  /**
   * PIN в открытом виде — существует только в возвращаемом значении этого
   * вызова, для немедленной отправки пользователю. В БД хранится только
   * хэш (AGENTS.md §4). `null`, если тариф без PIN или заказ уже был оплачен
   * раньше (см. идемпотентность ниже).
   */
  pin: string | null;
}

/**
 * Общая для любого платёжного провайдера логика после успешной оплаты —
 * TODO Фаза 7. UUID ссылки уже существует (это `order.id`, используется как
 * `/q/[uuid]`), здесь только расчёт срока действия и PIN для тарифа
 * "Максимум". Вызывается из вебхука конкретного провайдера (Фаза 7,
 * провайдер ещё не выбран) — сама эта функция от провайдера не зависит.
 */
export async function fulfillPaidOrder(
  orderId: string,
  payment: { provider: string; paymentId: string },
): Promise<FulfillResult> {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  if (order.status === "PAID") {
    // Провайдеры могут продублировать вебхук — PIN уже был отправлен при
    // первом вызове, заново его не генерируем и не показываем.
    return { orderId: order.id, expiresAt: order.expiresAt as Date, pin: null };
  }

  if (order.status !== "MODERATION_PASSED") {
    throw new OrderNotPayableError(`Заказ ${orderId} нельзя оплатить из статуса ${order.status}`);
  }

  const tariff = getTariff(PRISMA_TARIFF_TO_TARIFF_ID[order.tariff]);
  const expiresAt = new Date(Date.now() + (tariff.linkDurationDays ?? 0) * 24 * 60 * 60 * 1000);

  let pin: string | null = null;
  let pinCodeHash: string | undefined;
  if (tariff.pinProtected) {
    pin = generatePin();
    pinCodeHash = await hashPin(pin);
  }

  // Переход в PAID — условный UPDATE, а не read-then-write: два одновременных
  // вебхука оба видят MODERATION_PASSED выше, и без условия второй перезаписал
  // бы pinCodeHash своим PIN, а пользователю ушёл бы PIN первого (неверный).
  const updated = await prisma.order.updateMany({
    where: { id: order.id, status: "MODERATION_PASSED" },
    data: {
      status: "PAID",
      paymentProvider: payment.provider,
      paymentId: payment.paymentId,
      expiresAt,
      ...(pinCodeHash && { pinCodeHash }),
    },
  });

  if (updated.count === 0) {
    // Параллельный вызов успел первым — его PIN и отправляется пользователю.
    const current = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    if (current.status === "PAID") {
      return { orderId: current.id, expiresAt: current.expiresAt as Date, pin: null };
    }
    throw new OrderNotPayableError(`Заказ ${orderId} нельзя оплатить из статуса ${current.status}`);
  }

  return { orderId: order.id, expiresAt, pin };
}
