import { getUserPhoto } from "@/lib/storage/s3";
import { TEMPLATE_FIELD_SCHEMAS } from "@/lib/template-fields";
import type { OrderContent } from "@/lib/order-content";

import { moderatePhoto } from "./nudenet";
import { moderateTexts } from "./openai-text";

export interface ModerationResult {
  passed: boolean;
  /** Человекочитаемые причины отказа — показываются пользователю и пишутся в Order.moderationNote. */
  failures: string[];
}

/**
 * Прогоняет весь контент заказа (тексты + фото) через премодерацию —
 * AGENTS.md §4: "Модерация — до оплаты, а не после". Любая ошибка вызова
 * сервисов модерации трактуется как отказ (fail closed), а не как
 * автоматический пропуск — премодерацию нельзя обходить (AGENTS.md §7).
 */
export async function moderateOrderContent(content: OrderContent): Promise<ModerationResult> {
  const failures: string[] = [];

  const textItems: { label: string; value: string }[] = [];
  const photoItems: { label: string; key: string }[] = [];

  for (const [pageIndex, page] of content.pages.entries()) {
    const pageLabel = content.pages.length > 1 ? `Страница ${pageIndex + 1}` : null;
    const schema = TEMPLATE_FIELD_SCHEMAS[page.templateSlug as keyof typeof TEMPLATE_FIELD_SCHEMAS];
    if (!schema) continue;

    for (const field of schema.fields) {
      const value = page.fields[field.key];
      if (value?.trim()) {
        textItems.push({ label: [pageLabel, field.label].filter(Boolean).join(" — "), value });
      }
    }

    for (const group of schema.groups) {
      const items = page.groups[group.key] ?? [];
      items.forEach((item, index) => {
        const itemLabel = [pageLabel, `${group.label} №${index + 1}`].filter(Boolean).join(" — ");
        for (const field of group.fields) {
          const value = item.fields[field.key];
          if (value?.trim()) {
            textItems.push({ label: `${itemLabel} — ${field.label}`, value });
          }
        }
        if (item.photoKey) {
          photoItems.push({ label: itemLabel, key: item.photoKey });
        }
      });
    }
  }

  // Тексты — одним батч-запросом (см. lib/moderation/openai-text.ts).
  try {
    const flags = await moderateTexts(textItems.map((t) => t.value));
    flags.forEach((flagged, i) => {
      if (flagged) failures.push(`Текст "${textItems[i].label}" не прошёл проверку`);
    });
  } catch (error) {
    failures.push(
      `Не удалось проверить тексты: ${error instanceof Error ? error.message : "неизвестная ошибка"}`,
    );
  }

  // Фото — параллельно, сервис self-hosted, внешних лимитов нет.
  await Promise.all(
    photoItems.map(async ({ label, key }) => {
      try {
        const buffer = await getUserPhoto(key);
        const result = await moderatePhoto(buffer);
        if (!result.safe) failures.push(`Фото "${label}" не прошло проверку`);
      } catch (error) {
        failures.push(
          `Не удалось проверить фото "${label}": ${error instanceof Error ? error.message : "неизвестная ошибка"}`,
        );
      }
    }),
  );

  return { passed: failures.length === 0, failures };
}
