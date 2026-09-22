"use client";

import { motion } from "framer-motion";

import type { TemplateProps } from "../types";
import { extractYoutubeId, formatTogetherDuration } from "./duration";

/**
 * «Наша история» (обобщение "100 дней отношений", AGENTS.md §3a):
 * таймлайн событий с фото + YouTube-видео, счётчик "X лет/месяцев/дней
 * вместе" считается от даты начала отношений, а не зашит на 100-й день.
 */
export default function NashaIstoriya({ page }: TemplateProps) {
  const startDate = page.fields.startDate;
  const youtubeUrl = page.fields.youtubeUrl;
  const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

  const milestones = [...(page.groups.milestones ?? [])].sort((a, b) =>
    (a.fields.date ?? "").localeCompare(b.fields.date ?? ""),
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Наша история</h1>
        {startDate && (
          <p className="mt-2 text-lg text-rose-500">
            Вместе уже {formatTogetherDuration(startDate)}
          </p>
        )}
      </div>

      {youtubeId && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube видео"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="relative flex flex-col gap-8 border-l-2 border-rose-200 pl-6 dark:border-rose-900">
        {milestones.map((milestone, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full bg-rose-500" />
            {milestone.fields.date && (
              <p className="text-xs font-medium text-rose-500">{milestone.fields.date}</p>
            )}
            {milestone.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- динамический источник из S3
              <img
                src={milestone.photoUrl}
                alt=""
                className="mt-2 max-h-64 w-full rounded-xl object-cover"
              />
            )}
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{milestone.fields.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
