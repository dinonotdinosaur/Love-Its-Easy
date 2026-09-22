"""
Self-hosted NSFW-модерация фото (NudeNet, ONNX) — AGENTS.md §2.

Отдельный лёгкий сервис вместо платного SaaS (Sightengine/Cloudmersive):
на объёме MVP подписка — чистый убыток, а self-hosted держит фото
пользователей в RU-периметре (152-ФЗ). Не заменять на внешний API без
обсуждения (AGENTS.md §7).
"""

import io
import os
import uuid

from fastapi import FastAPI, File, HTTPException, UploadFile
from nudenet import NudeDetector
from PIL import Image

app = FastAPI(title="loveitseasy NSFW moderation")
detector = NudeDetector()

# Метки NudeNet, которые считаем NSFW для целей премодерации.
# Порог и набор меток предварительные — требуют калибровки на тестовой
# выборке фото на этапе реализации (открытый вопрос AGENTS.md §8.2),
# не финальное значение.
UNSAFE_LABELS = {
    "FEMALE_BREAST_EXPOSED",
    "FEMALE_GENITALIA_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
    "BUTTOCKS_EXPOSED",
    "ANUS_EXPOSED",
}
CONFIDENCE_THRESHOLD = float(os.environ.get("NUDENET_THRESHOLD", "0.5"))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/moderate")
async def moderate(image: UploadFile = File(...)):
    data = await image.read()

    try:
        Image.open(io.BytesIO(data)).verify()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Некорректное изображение") from exc

    tmp_path = f"/tmp/{uuid.uuid4()}.jpg"
    with open(tmp_path, "wb") as f:
        f.write(data)

    try:
        raw_detections = detector.detect(tmp_path)
    finally:
        os.remove(tmp_path)

    detections = [
        {"label": d.get("class") or d.get("label"), "score": d.get("score", 0.0)}
        for d in raw_detections
    ]
    flagged = [
        d
        for d in detections
        if d["label"] in UNSAFE_LABELS and d["score"] >= CONFIDENCE_THRESHOLD
    ]

    return {"safe": len(flagged) == 0, "detections": detections}
