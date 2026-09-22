/**
 * Клиент к бесплатному OpenAI Moderation API — love_its_easy.md §3.
 *
 * Принимает массив текстов и отправляет их ОДНИМ запросом (API поддерживает
 * `input` как массив строк, результаты возвращаются в том же порядке) —
 * заказ с несколькими полями/карточками иначе упирается в rate limit
 * OpenAI при параллельных запросах по одному на текст.
 */
export async function moderateTexts(texts: string[]): Promise<boolean[]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY не настроен");
  }

  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: texts }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI Moderation API вернул ошибку: ${res.status}`);
  }

  const data = (await res.json()) as { results: Array<{ flagged: boolean }> };
  return texts.map((_, i) => data.results[i]?.flagged ?? false);
}
