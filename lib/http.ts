/**
 * IP клиента для лимитов. Next.js не отдаёт адрес сокета в route handler,
 * поэтому берём X-Forwarded-For — и именно ПОСЛЕДНИЙ адрес: его дописывает
 * наш reverse proxy (nginx: `proxy_add_x_forwarded_for`), а всё левее клиент
 * может подставить сам. Без прокси (локальная разработка) заголовка нет —
 * все запросы попадают в одну корзину "unknown".
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  return last || "unknown";
}

/**
 * Тело запроса как JSON-объект или `null`, если это не JSON / не объект.
 * `request.json()` на битом теле бросает исключение, и роут отдавал 500
 * вместо 400 — все API-роуты читают тело через эту функцию.
 */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
