import { NextResponse } from "next/server";

import { fulfillPaidOrder, OrderNotPayableError } from "@/lib/payments/fulfill-order";

/**
 * Временная заглушка вместо реального платёжного провайдера (AGENTS.md
 * §8.1 — выбор ещё не сделан). Позволяет проверить путь
 * MODERATION_PASSED -> PAID (PIN, срок ссылки) не дожидаясь интеграции
 * с Robokassa/ЮKassa. Удалить, когда появится настоящий вебхук.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Недоступно в production" }, { status: 404 });
  }

  const body = (await request.json()) as { orderId?: string };
  if (!body.orderId) {
    return NextResponse.json({ error: "orderId обязателен" }, { status: 400 });
  }

  try {
    const result = await fulfillPaidOrder(body.orderId, {
      provider: "dev-manual",
      paymentId: `dev-${Date.now()}`,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OrderNotPayableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
