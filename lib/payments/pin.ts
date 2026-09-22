import bcrypt from "bcryptjs";

/** Случайный 4-значный PIN с ведущими нулями (AGENTS.md §4). */
export function generatePin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

/** Хэш для хранения — сам PIN в БД не сохраняется (AGENTS.md §4). */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}
