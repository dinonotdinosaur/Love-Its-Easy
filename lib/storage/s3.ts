import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "ru-central1",
  // Провайдеры S3-совместимых хранилищ (RustFS локально, Timeweb, Yandex) обычно
  // требуют path-style обращение вместо virtual-hosted.
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15 МБ на исходный файл, до конвертации
const UPLOADS_PREFIX = "uploads/";

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
  const key = `${UPLOADS_PREFIX}${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;

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

/** Ключи всех загруженных фото, созданных раньше `before` (для очистки неиспользованных). */
export async function listUploadedPhotosBefore(before: Date): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: UPLOADS_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );
    for (const object of page.Contents ?? []) {
      if (object.Key && object.LastModified && object.LastModified < before) {
        keys.push(object.Key);
      }
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

/** Удаляет фото пачками (лимит S3 API — 1000 ключей на запрос). */
export async function deleteUserPhotos(keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: process.env.S3_BUCKET,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    if (result.Errors?.length) {
      throw new Error(`S3 не удалил ${result.Errors.length} объект(ов): ${result.Errors[0].Message}`);
    }
  }
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
