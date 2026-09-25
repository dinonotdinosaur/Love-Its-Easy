import { NextResponse } from "next/server";

import { getClientIp } from "@/lib/http";
import { createRateLimiter } from "@/lib/rate-limit";
import { InvalidPhotoError, uploadUserPhoto } from "@/lib/storage/s3";

// Роут открыт без авторизации — без лимита любой мог забивать S3 файлами.
// 40 за 10 минут: с запасом на заказ "Максимум" (20 фото) плюс замены.
const uploadLimiter = createRateLimiter({ limit: 40, windowMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  // До чтения тела — отказ не должен стоить нам приёма 15 МБ.
  // Без IP (нет прокси — локальная разработка) все попадают в одну корзину.
  const limit = uploadLimiter.check(getClientIp(request) ?? "unknown");
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много загрузок. Попробуйте чуть позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  // formData() бросает на теле не в формате multipart/urlencoded — это 400, а не 500.
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { key } = await uploadUserPhoto(buffer);
    return NextResponse.json({ key });
  } catch (error) {
    if (error instanceof InvalidPhotoError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
