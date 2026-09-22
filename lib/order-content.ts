import { TEMPLATE_FIELD_SCHEMAS } from "@/lib/template-fields";
import { getTariff, isTemplateAllowedForTariff, maxPhotosPerPage, type TariffId } from "@/lib/tariffs";

export interface GroupItemContent {
  fields: Record<string, string>;
  photoKey?: string;
}

export interface PageContent {
  templateSlug: string;
  fields: Record<string, string>;
  groups: Record<string, GroupItemContent[]>;
}

export interface OrderContent {
  pages: PageContent[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isGroupItemEmpty(item: GroupItemContent): boolean {
  return !item.photoKey && Object.values(item.fields).every((value) => !value?.trim());
}

/**
 * Форма всегда рендерит `maxItems` слотов группы, но пустые "лишние" слоты
 * не должны попадать ни в валидацию, ни в БД — убираем их здесь, до
 * проверки количества элементов группы.
 */
export function sanitizeOrderContent(tariffId: TariffId, content: OrderContent): OrderContent {
  return {
    pages: content.pages.map((page) => {
      const schema = TEMPLATE_FIELD_SCHEMAS[page.templateSlug as keyof typeof TEMPLATE_FIELD_SCHEMAS];
      if (!schema) return page;

      const groups: Record<string, GroupItemContent[]> = {};
      for (const group of schema.groups) {
        groups[group.key] = (page.groups[group.key] ?? []).filter((item) => !isGroupItemEmpty(item));
      }

      return { ...page, groups };
    }),
  };
}

/** Возвращает текст первой найденной ошибки валидации или `null`, если всё в порядке. */
export function validateOrderContent(
  tariffId: TariffId,
  email: string,
  content: OrderContent,
): string | null {
  if (!EMAIL_RE.test(email)) {
    return "Некорректный email";
  }

  const tariff = getTariff(tariffId);

  if (content.pages.length !== tariff.pageCount) {
    return `Ожидается страниц: ${tariff.pageCount}`;
  }

  for (const page of content.pages) {
    const schema = TEMPLATE_FIELD_SCHEMAS[page.templateSlug as keyof typeof TEMPLATE_FIELD_SCHEMAS];
    if (!schema || !isTemplateAllowedForTariff(tariffId, schema.slug)) {
      return `Шаблон "${page.templateSlug}" недоступен на этом тарифе`;
    }

    for (const field of schema.fields) {
      const value = page.fields[field.key]?.trim() ?? "";
      if (field.required && value.length === 0) {
        return `Заполните поле "${field.label}"`;
      }
      if (field.maxLength && value.length > field.maxLength) {
        return `Поле "${field.label}" слишком длинное`;
      }
    }

    let photosOnPage = 0;

    for (const group of schema.groups) {
      const items = page.groups[group.key] ?? [];
      if (items.length < group.minItems || items.length > group.maxItems) {
        return `"${group.label}": нужно от ${group.minItems} до ${group.maxItems}`;
      }

      for (const item of items) {
        for (const field of group.fields) {
          const value = item.fields[field.key]?.trim() ?? "";
          if (field.required && value.length === 0) {
            return `Заполните поле "${field.label}" в разделе "${group.label}"`;
          }
          if (field.maxLength && value.length > field.maxLength) {
            return `Поле "${field.label}" в разделе "${group.label}" слишком длинное`;
          }
        }
        if (item.photoKey) {
          if (!group.photoPerItem) {
            return `"${group.label}" не поддерживает фото`;
          }
          photosOnPage += 1;
        }
      }
    }

    const maxPhotos = maxPhotosPerPage(tariffId);
    if (photosOnPage > maxPhotos) {
      return `Слишком много фото на странице (лимит тарифа: ${maxPhotos})`;
    }
  }

  return null;
}

/** Пустой контент страницы под выбранный шаблон — стартовое состояние формы. */
export function makeEmptyPageContent(templateSlug: string): PageContent {
  const schema = TEMPLATE_FIELD_SCHEMAS[templateSlug as keyof typeof TEMPLATE_FIELD_SCHEMAS];
  const groups: Record<string, GroupItemContent[]> = {};
  for (const group of schema?.groups ?? []) {
    groups[group.key] = Array.from({ length: group.maxItems }, () => ({ fields: {} }));
  }
  return { templateSlug, fields: {}, groups };
}

/** Есть ли в контенте заказа хотя бы одно загруженное фото. */
export function contentHasPhotos(content: OrderContent): boolean {
  return content.pages.some((page) =>
    Object.values(page.groups).some((items) => items.some((item) => item.photoKey)),
  );
}
