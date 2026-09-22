/** Клиент к self-hosted NudeNet-сервису (services/nsfw) — AGENTS.md §2, §7. */
export async function moderatePhoto(imageBuffer: Buffer): Promise<{ safe: boolean }> {
  const baseUrl = process.env.NUDENET_SERVICE_URL;
  if (!baseUrl) {
    throw new Error("NUDENET_SERVICE_URL не настроен");
  }

  const formData = new FormData();
  formData.append("image", new Blob([new Uint8Array(imageBuffer)]), "photo.webp");

  const res = await fetch(`${baseUrl}/moderate`, { method: "POST", body: formData });
  if (!res.ok) {
    throw new Error(`NudeNet-сервис вернул ошибку: ${res.status}`);
  }

  const data = (await res.json()) as { safe: boolean };
  return { safe: data.safe };
}
