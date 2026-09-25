// `register` вызывается один раз при старте сервера, до приёма запросов.
// Node-специфичный код — только через импорт в ветке nodejs: Next.js
// компилирует этот файл и для Edge-рантайма.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkEnv } = await import("./lib/env-check");
    checkEnv();
  }
}
