FROM python:3.11-slim

WORKDIR /app

# libgl1/libglib2.0-0 — рантайм-зависимости opencv (используется NudeNet
# для предобработки изображений).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Прогреваем загрузку весов модели на этапе сборки — иначе первый же
# запрос к контейнеру после старта тянул бы их из интернета.
RUN python -c "from nudenet import NudeDetector; NudeDetector()"

COPY main.py .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
