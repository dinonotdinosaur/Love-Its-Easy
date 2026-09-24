import { NextResponse } from "next/server";

import { checkOrderPin } from "@/lib/access/pin";
import { createPinToken, pinCookieName } from "@/lib/access/pin-session";
import { prisma } from "@/lib/db/client";
import { ruPlural } from "@/lib/format";
import { readJsonObject } from "@/lib/http";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;
const PIN_RE = /^\d{4}$/;

function formatRetryAfter(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} ${ruPlural(minutes, ["минуту", "минуты", "минут"])}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} ${ruPlural(hours, ["час", "часа", "часов"])}`;
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);

  if (
    !body ||
    typeof body.orderId !== "string" ||
    typeof body.pin !== "string" ||
    !PIN_RE.test(body.pin)
  ) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order || order.status !== "PAID" || !order.pinCodeHash) {
    // Не раскрываем, чего именно не хватает — заказ не найден или PIN не задан выглядят одинаково.
    return NextResponse.json({ error: "Неверный PIN" }, { status: 401 });
  }

  const result = await checkOrderPin(
    { id: order.id, pinCodeHash: order.pinCodeHash, pinLockouts: order.pinLockouts },
    body.pin,
  );

  if (result.status === "locked") {
    return NextResponse.json(
      {
        error: `Слишком много неверных попыток. Попробуйте через ${formatRetryAfter(result.retryAfterSeconds)}.`,
      },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
    );
  }

  if (result.status === "invalid") {
    return NextResponse.json({ error: "Неверный PIN" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(pinCookieName(order.id), createPinToken(order.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
  return response;
}
