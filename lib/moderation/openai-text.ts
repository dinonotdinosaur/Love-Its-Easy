/** Клиент к бесплатному OpenAI Moderation API — love_its_easy.md §3. */
export async function moderateText(text: string): Promise<{ flagged: boolean }> {
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
    body: JSON.stringify({ input: text }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI Moderation API вернул ошибку: ${res.status}`);
  }

  const data = (await res.json()) as { results: Array<{ flagged: boolean }> };
  return { flagged: data.results[0]?.flagged ?? false };
}
