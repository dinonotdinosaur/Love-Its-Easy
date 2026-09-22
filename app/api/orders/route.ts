import { NextResponse } from "next/server";

import { CONSENT_TEXT } from "@/lib/consent";
import { prisma } from "@/lib/db/client";
import { moderateOrderContent } from "@/lib/moderation";
import {
  contentHasPhotos,
  sanitizeOrderContent,
  validateOrderContent,
  type OrderContent,
} from "@/lib/order-content";
import { TARIFF_ID_TO_PRISMA_TARIFF, TARIFFS, type TariffId } from "@/lib/tariffs";

interface CreateOrderBody {
  tariffId: string;
  email: string;
  content: OrderContent;
  consentGiven: boolean;
}

function isTariffId(value: string): value is TariffId {
  return value in TARIFFS;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateOrderBody>;

  if (
    typeof body.tariffId !== "string" ||
    !isTariffId(body.tariffId) ||
    typeof body.email !== "string" ||
    !body.content ||
    !Array.isArray(body.content.pages)
  ) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const tariffId = body.tariffId;
  const email = body.email;
  const content = sanitizeOrderContent(tariffId, body.content);

  const validationError = validateOrderContent(tariffId, email, content);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const needsConsent = contentHasPhotos(content);
  if (needsConsent && body.consentGiven !== true) {
    return NextResponse.json(
      { error: "Нужно подтвердить согласие на использование фото" },
      { status: 400 },
    );
  }

  const tariff = TARIFFS[tariffId];

  const order = await prisma.order.create({
    data: {
      tariff: TARIFF_ID_TO_PRISMA_TARIFF[tariffId],
      status: "MODERATION_PENDING",
      templateSlug: content.pages[0].templateSlug,
      content: content as unknown as object,
      email,
      amountKopecks: tariff.priceRub * 100,
      ...(needsConsent && {
        consentLogs: {
          create: {
            consentText: CONSENT_TEXT,
            ipAddress: request.headers.get("x-forwarded-for"),
            userAgent: request.headers.get("user-agent"),
          },
        },
      }),
    },
  });

  // Модерация — до оплаты (AGENTS.md §4). Заказ уже создан со статусом
  // MODERATION_PENDING, чтобы неудачные попытки тоже оставались в БД —
  // это и есть материал для калибровки порогов NudeNet (AGENTS.md §8.2).
  const moderation = await moderateOrderContent(content);

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: moderation.passed ? "MODERATION_PASSED" : "MODERATION_FAILED",
      moderationNote: moderation.passed ? null : moderation.failures.join("; "),
    },
  });

  if (!moderation.passed) {
    return NextResponse.json(
      {
        orderId: updated.id,
        error: "Автоматическая модерация не пройдена",
        failures: moderation.failures,
      },
      { status: 422 },
    );
  }

  return NextResponse.json({ orderId: updated.id });
}
