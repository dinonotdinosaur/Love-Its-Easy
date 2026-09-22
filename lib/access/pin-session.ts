import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * После верного PIN браузеру выдаётся подписанная cookie, доказывающая
 * "PIN для этого заказа уже введён верно" — без серверного хранилища
 * сессий. AGENTS.md §4: проверка обязана быть серверной, контент не
 * должен присутствовать в HTML/JS до её прохождения (см. `app/q/[uuid]`).
 */

function sign(orderId: string): string {
  const secret = process.env.PIN_COOKIE_SECRET;
  if (!secret) {
    throw new Error("PIN_COOKIE_SECRET не настроен");
  }
  return createHmac("sha256", secret).update(orderId).digest("hex");
}

export function pinCookieName(orderId: string): string {
  return `pin_ok_${orderId}`;
}

export function createPinToken(orderId: string): string {
  return sign(orderId);
}

export function verifyPinToken(orderId: string, token: string | undefined): boolean {
  if (!token) return false;

  const expected = Buffer.from(sign(orderId));
  const actual = Buffer.from(token);
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}
