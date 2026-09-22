"use client";

import { useState } from "react";

/**
 * "Ленивый" YouTube-embed: сначала только превью-картинка с кнопкой play,
 * сам тяжёлый `<iframe>` (свои скрипты и запросы к youtube.com) вставляется
 * в DOM только по клику. Без этого страница ощутимо долго "грузится" —
 * `<iframe>` c youtube.com тянет за собой кучу сетевых запросов сразу же.
 */
export function YoutubeEmbed({ videoId }: { videoId: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube видео"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-200 dark:bg-zinc-800"
      aria-label="Воспроизвести видео"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- внешняя превью-картинка YouTube, не наш S3 */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        className="h-full w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl text-rose-500">
          ▶
        </span>
      </span>
    </button>
  );
}
