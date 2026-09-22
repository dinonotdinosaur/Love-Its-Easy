/**
 * Единая конфигурация тарифов — источник истины по лимитам (шаблоны/фото/
 * срок/PIN). Цифры нигде больше по коду не хардкодятся (AGENTS.md §6).
 */

import { formatLinkDuration } from "@/lib/format";

export const TEMPLATE_SLUGS = [
  "ty-samaya-krasivaya",
  "vyberi-svidanie",
  "nasha-istoriya",
  "priznanie-v-lyubvi",
  "ty-protiv-menya",
] as const;

export type TemplateSlug = (typeof TEMPLATE_SLUGS)[number];

export const TEMPLATE_TITLES: Record<TemplateSlug, string> = {
  "ty-samaya-krasivaya": "Ты самая красивая",
  "vyberi-svidanie": "Выбери свидание",
  "nasha-istoriya": "Наша история",
  "priznanie-v-lyubvi": "Признание в любви",
  "ty-protiv-menya": "Ты против меня",
};

// Шаблоны без фото — тариф "Лёгкий" их не отправляет на NSFW-модерацию
// вообще (AGENTS.md §3), только через бесплатный текстовый модератор.
export const PHOTO_FREE_TEMPLATE_SLUGS: readonly TemplateSlug[] = [
  "vyberi-svidanie",
  "ty-protiv-menya",
];

export type TariffId = "legkiy" | "kvest" | "maksimum" | "dlya-dvoikh";

export type TariffCategory = "base" | "secondary";

export interface TariffConfig {
  id: TariffId;
  category: TariffCategory;
  title: string;
  priceRub: number;
  /** Доступные шаблоны; `"all"` — все шаблоны из TEMPLATE_SLUGS. */
  templates: "all" | readonly TemplateSlug[];
  maxPhotos: number;
  /** Срок жизни ссылки в днях; `null` — не применимо (напр. отдельный формат). */
  linkDurationDays: number | null;
  pinProtected: boolean;
  subdomain: boolean;
  /** Количество "страниц" квеста — 1 для всех тарифов "Базы", 2 для "Для двоих". */
  pageCount: number;
}

// Линейная лестница "Базы" — каждый следующий тариф строго превосходит
// предыдущий (AGENTS.md §3). Не менять порядок/состав без обсуждения.
export const BASE_TARIFFS = {
  legkiy: {
    id: "legkiy",
    category: "base",
    title: "Лёгкий",
    priceRub: 199,
    templates: PHOTO_FREE_TEMPLATE_SLUGS,
    maxPhotos: 0,
    linkDurationDays: 7,
    pinProtected: false,
    subdomain: false,
    pageCount: 1,
  },
  kvest: {
    id: "kvest",
    category: "base",
    title: "Квест",
    priceRub: 499,
    templates: "all",
    maxPhotos: 10,
    linkDurationDays: 365,
    pinProtected: false,
    subdomain: false,
    pageCount: 1,
  },
  maksimum: {
    id: "maksimum",
    category: "base",
    title: "Максимум",
    priceRub: 999,
    templates: "all",
    maxPhotos: 20,
    linkDurationDays: 365 * 3,
    pinProtected: true,
    subdomain: true,
    pageCount: 1,
  },
} as const satisfies Record<string, TariffConfig>;

// Вторичные форматы — отдельная категория, не часть лестницы "Базы"
// (AGENTS.md §3). Список открыт для расширения по мере обсуждения.
export const SECONDARY_TARIFFS = {
  "dlya-dvoikh": {
    id: "dlya-dvoikh",
    category: "secondary",
    title: "Для двоих",
    priceRub: 799,
    templates: "all",
    maxPhotos: 10, // до 5 фото на страницу × 2 страницы
    linkDurationDays: 365,
    pinProtected: false,
    subdomain: false,
    pageCount: 2,
  },
} as const satisfies Record<string, TariffConfig>;

export const TARIFFS: Record<TariffId, TariffConfig> = {
  ...BASE_TARIFFS,
  ...SECONDARY_TARIFFS,
};

export function getTariff(id: TariffId): TariffConfig {
  return TARIFFS[id];
}

export function isTemplateAllowedForTariff(
  tariffId: TariffId,
  templateSlug: TemplateSlug,
): boolean {
  const tariff = getTariff(tariffId);
  return tariff.templates === "all" || tariff.templates.includes(templateSlug);
}

export function maxPhotosPerPage(tariffId: TariffId): number {
  const tariff = getTariff(tariffId);
  return Math.floor(tariff.maxPhotos / tariff.pageCount);
}

// Prisma-энум Order.tariff использует UPPER_SNAKE (конвенция БД), тогда как
// TariffId — kebab-case для URL (`/order/dlya-dvoikh`). Единая точка перевода
// между ними, чтобы не дублировать маппинг в каждом месте создания заказа.
export const TARIFF_ID_TO_PRISMA_TARIFF = {
  legkiy: "LEGKIY",
  kvest: "KVEST",
  maksimum: "MAKSIMUM",
  "dlya-dvoikh": "DLYA_DVOIKH",
} as const satisfies Record<TariffId, string>;

/** Обратный маппинг — из значения Prisma-энума обратно в TariffId. */
export const PRISMA_TARIFF_TO_TARIFF_ID: Record<string, TariffId> = Object.fromEntries(
  Object.entries(TARIFF_ID_TO_PRISMA_TARIFF).map(([id, prismaValue]) => [prismaValue, id]),
) as Record<string, TariffId>;

/**
 * Список пунктов для карточки тарифа на витрине — выводится из конфигурации,
 * чтобы цифры лимитов не расходились между лендингом и остальным кодом
 * (AGENTS.md §6: единая конфигурация, не хардкодить по месту).
 */
export function getTariffFeatures(tariffId: TariffId): string[] {
  const tariff = getTariff(tariffId);
  const features: string[] = [];

  features.push(
    tariff.templates === "all"
      ? `Все ${TEMPLATE_SLUGS.length} шаблонов`
      : `${tariff.templates.length} шаблона без фото`,
  );

  if (tariff.maxPhotos === 0) {
    features.push("Без фото");
  } else if (tariff.pageCount > 1) {
    features.push(`До ${tariff.maxPhotos} фото (по ${maxPhotosPerPage(tariffId)} на страницу)`);
  } else {
    features.push(`До ${tariff.maxPhotos} фото`);
  }

  if (tariff.linkDurationDays !== null) {
    features.push(`Ссылка активна ${formatLinkDuration(tariff.linkDurationDays)}`);
  }

  if (tariff.pageCount > 1) {
    features.push(`${tariff.pageCount} страницы — взаимный обмен сюрпризами`);
  }

  if (tariff.pinProtected) {
    features.push("Защита PIN-кодом");
  }

  if (tariff.subdomain) {
    features.push("Свой адрес: slug.loveitseasy.ru");
  }

  return features;
}
