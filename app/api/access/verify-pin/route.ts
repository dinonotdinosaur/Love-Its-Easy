import { NextResponse } from "next/server";

import { verifyPin } from "@/lib/access/pin";
import { createPinToken, pinCookieName } from "@/lib/access/pin-session";
import { prisma } from "@/lib/db/client";

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const body = (await request.json()) as { orderId?: string; pin?: string };

  if (typeof body.orderId !== "string" || typeof body.pin !== "string") {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order || order.status !== "PAID" || !order.pinCodeHash) {
    // Не раскрываем, чего именно не хватает — заказ не найден или PIN не задан выглядят одинаково.
    return NextResponse.json({ error: "Неверный PIN" }, { status: 401 });
  }

  const isValid = await verifyPin(body.pin, order.pinCodeHash);
  if (!isValid) {
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
