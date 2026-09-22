import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "ru-central1",
  // Провайдеры S3-совместимых хранилищ (MinIO, Timeweb, Yandex) обычно
  // требуют path-style обращение вместо virtual-hosted.
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15 МБ на исходный файл, до конвертации

export class InvalidPhotoError extends Error {}

/**
 * Конвертирует загруженное пользователем фото в WebP и кладёт в S3-бакет
 * (AGENTS.md §2: "Пользовательские фото конвертируются в WebP"). Возвращает
 * ключ объекта — он же хранится в `content` заказа до его создания.
 */
export async function uploadUserPhoto(source: Buffer): Promise<{ key: string }> {
  if (source.byteLength > MAX_SOURCE_BYTES) {
    throw new InvalidPhotoError("Файл слишком большой");
  }

  let webp: Buffer;
  try {
    webp = await sharp(source).rotate().webp({ quality: 82 }).toBuffer();
  } catch {
    throw new InvalidPhotoError("Не удалось прочитать изображение");
  }

  const now = new Date();
  const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: webp,
      ContentType: "image/webp",
    }),
  );

  return { key };
}

/** Скачивает фото из S3 обратно в память — нужно для передачи в NudeNet на модерацию. */
export async function getUserPhoto(key: string): Promise<Buffer> {
  const result = await client.send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
  );
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) {
    throw new InvalidPhotoError("Фото не найдено в хранилище");
  }
  return Buffer.from(bytes);
}

/**
 * Временный подписанный URL на приватный объект в S3 — для показа фото
 * на странице квеста (`/q/[uuid]`, Фаза 9). Бакет не публичный, поэтому
 * прямая ссылка на `photoKey` не откроется без подписи.
 */
export async function getSignedPhotoUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}
