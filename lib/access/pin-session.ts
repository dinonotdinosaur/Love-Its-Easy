import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * После верного PIN браузеру выдаётся подписанная cookie, доказывающая
 * "PIN для этого заказа уже введён верно" — без серверного хранилища
 * сессий. AGENTS.md §4: проверка обязана быть серверной, контент не
 * должен присутствовать в HTML/JS до её прохождения (см. `app/q/[uuid]`).
 */

// В подпись входит и хэш текущего PIN: если PIN заказа сменят (например,
// перегенерация ссылки после запроса на удаление фото, AGENTS.md §4), все
// ранее выданные cookie перестают действовать — иначе доступ оставался бы
// у всех, кто знал старый PIN.
function sign(orderId: string, pinCodeHash: string): string {
  const secret = process.env.PIN_COOKIE_SECRET;
  if (!secret) {
    throw new Error("PIN_COOKIE_SECRET не настроен");
  }
  return createHmac("sha256", secret).update(`${orderId}:${pinCodeHash}`).digest("hex");
}

export function pinCookieName(orderId: string): string {
  return `pin_ok_${orderId}`;
}

export function createPinToken(orderId: string, pinCodeHash: string): string {
  return sign(orderId, pinCodeHash);
}

export function verifyPinToken(
  orderId: string,
  pinCodeHash: string,
  token: string | undefined,
): boolean {
  if (!token) return false;

  const expected = Buffer.from(sign(orderId, pinCodeHash));
  const actual = Buffer.from(token);
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}
