/**
 * Проверка окружения при старте сервера (вызывается из `instrumentation.ts`
 * до того, как сервер начнёт принимать запросы). Без неё пропущенная
 * переменная всплывала бы только на конкретном действии пользователя —
 * например, без PIN_COOKIE_SECRET покупатель "Максимума" получал бы ошибку,
 * открыв свою ссылку, а сервер при этом считался бы здоровым.
 *
 * В production — процесс завершается с кодом 1, в разработке — только
 * предупреждение. Полный список и назначение переменных — `.env.example`,
 * DEPLOY.md §2. Только Node.js-рантайм (использует process.exit).
 */

const REQUIRED = [
  "DATABASE_URL",
  "S3_ENDPOINT",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "NUDENET_SERVICE_URL",
  "OPENAI_API_KEY",
  "PIN_COOKIE_SECRET",
  "CRON_SECRET",
] as const;

// Секреты для HMAC/авторизации: короткое значение перебирается.
const SECRETS_MIN_LENGTH: Partial<Record<(typeof REQUIRED)[number], number>> = {
  PIN_COOKIE_SECRET: 32,
  CRON_SECRET: 32,
};

export function checkEnv() {
  const problems: string[] = [];
  for (const name of REQUIRED) {
    const value = process.env[name];
    const minLength = SECRETS_MIN_LENGTH[name];
    if (!value) {
      problems.push(`${name} не задана`);
    } else if (minLength && value.length < minLength) {
      problems.push(`${name} короче ${minLength} символов`);
    }
  }

  if (problems.length === 0) return;

  const message = `Некорректное окружение:\n  - ${problems.join("\n  - ")}\nСм. .env.example и DEPLOY.md §2.`;
  if (process.env.NODE_ENV === "production") {
    // Не throw: исключение из register Next.js только логирует, процесс
    // остаётся жить и отвечает 500 на каждый запрос, а systemd/pm2 считают
    // его здоровым. Выход с кодом 1 сразу виден в статусе сервиса.
    console.error(message);
    process.exit(1);
  }
  console.warn(`[env] ${message}`);
}
