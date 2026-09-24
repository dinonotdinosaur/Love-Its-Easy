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
