import bcrypt from "bcryptjs";

/** Сверка введённого PIN с хэшем из `Order.pinCodeHash` (AGENTS.md §4). */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
