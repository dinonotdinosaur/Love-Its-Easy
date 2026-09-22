import { getUserPhoto } from "@/lib/storage/s3";
import { TEMPLATE_FIELD_SCHEMAS } from "@/lib/template-fields";
import type { OrderContent } from "@/lib/order-content";

import { moderatePhoto } from "./nudenet";
import { moderateText } from "./openai-text";

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
  const tasks: Promise<void>[] = [];

  function checkText(label: string, value: string | undefined) {
    if (!value?.trim()) return;
    tasks.push(
      moderateText(value)
        .then((result) => {
          if (result.flagged) failures.push(`Текст "${label}" не прошёл проверку`);
        })
        .catch((error: unknown) => {
          failures.push(
            `Не удалось проверить текст "${label}": ${error instanceof Error ? error.message : "неизвестная ошибка"}`,
          );
        }),
    );
  }

  function checkPhoto(label: string, key: string | undefined) {
    if (!key) return;
    tasks.push(
      getUserPhoto(key)
        .then((buffer) => moderatePhoto(buffer))
        .then((result) => {
          if (!result.safe) failures.push(`Фото "${label}" не прошло проверку`);
        })
        .catch((error: unknown) => {
          failures.push(
            `Не удалось проверить фото "${label}": ${error instanceof Error ? error.message : "неизвестная ошибка"}`,
          );
        }),
    );
  }

  for (const [pageIndex, page] of content.pages.entries()) {
    const pageLabel = content.pages.length > 1 ? `Страница ${pageIndex + 1}` : null;
    const schema = TEMPLATE_FIELD_SCHEMAS[page.templateSlug as keyof typeof TEMPLATE_FIELD_SCHEMAS];
    if (!schema) continue;

    for (const field of schema.fields) {
      checkText(
        [pageLabel, field.label].filter(Boolean).join(" — "),
        page.fields[field.key],
      );
    }

    for (const group of schema.groups) {
      const items = page.groups[group.key] ?? [];
      items.forEach((item, index) => {
        const itemLabel = [pageLabel, `${group.label} №${index + 1}`].filter(Boolean).join(" — ");
        for (const field of group.fields) {
          checkText(`${itemLabel} — ${field.label}`, item.fields[field.key]);
        }
        checkPhoto(itemLabel, item.photoKey);
      });
    }
  }

  await Promise.all(tasks);

  return { passed: failures.length === 0, failures };
}
