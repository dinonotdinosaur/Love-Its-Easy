import { NextResponse } from "next/server";

import { InvalidPhotoError, uploadUserPhoto } from "@/lib/storage/s3";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("photo");

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
