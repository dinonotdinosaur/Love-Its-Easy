import type { TemplateSlug } from "@/lib/tariffs";

/**
 * Схема полей ввода для каждого шаблона — общий контракт между формой
 * заказа (Фаза 5) и рендером шаблона (Фаза 8). Живёт в `lib/`, а не в
 * `/templates` (та директория — сами компоненты шаблонов, AGENTS.md §5).
 *
 * Без визуального конструктора (love_its_easy.md §1) — поэтому повторяемые
 * группы (карточки, вопросы и т.п.) имеют фиксированный диапазон
 * количества слотов, а не свободное добавление/удаление пользователем.
 */

export type FieldType = "text" | "textarea" | "date" | "url" | "select";

export interface SimpleField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  /** Только для type: "select" — варианты значения поля. */
  options?: { value: string; label: string }[];
}

export interface RepeatableGroup {
  key: string;
  label: string;
  minItems: number;
  maxItems: number;
  photoPerItem: boolean;
  fields: SimpleField[];
}

export interface TemplateFieldSchema {
  slug: TemplateSlug;
  fields: SimpleField[];
  groups: RepeatableGroup[];
}

export const TEMPLATE_FIELD_SCHEMAS: Record<TemplateSlug, TemplateFieldSchema> = {
  // «Ты самая красивая»: 10 фото с текстами, карточки раскрываются
  // анимацией (love_its_easy.md §6).
  "ty-samaya-krasivaya": {
    slug: "ty-samaya-krasivaya",
    fields: [
      {
        key: "finalMessage",
        label: "Финальное сообщение (появится, когда открыты все карточки)",
        type: "textarea",
        maxLength: 200,
        placeholder: "И это ещё не все причины, почему я тебя люблю…",
      },
    ],
    groups: [
      {
        key: "cards",
        label: "Карточки",
        minItems: 3,
        maxItems: 10,
        photoPerItem: true,
        fields: [
          {
            key: "text",
            label: "Текст на карточке",
            type: "textarea",
            required: true,
            maxLength: 200,
          },
        ],
      },
    ],
  },

  // «Выбери свидание»: опрос с "убегающей кнопкой" ответа "Нет" и
  // финальной картой с вариантами свидания.
  "vyberi-svidanie": {
    slug: "vyberi-svidanie",
    fields: [
      {
        key: "question",
        label: "Вопрос",
        type: "text",
        required: true,
        maxLength: 120,
        placeholder: "Пойдёшь со мной на свидание?",
      },
      {
        key: "finalMessage",
        label: "Финальное сообщение (после выбора даты и времени)",
        type: "text",
        maxLength: 100,
        placeholder: "Жду тебя! 💕",
      },
    ],
    groups: [
      {
        key: "dateOptions",
        label: "Варианты свидания на финальной карте",
        minItems: 1,
        maxItems: 3,
        photoPerItem: false,
        fields: [
          { key: "title", label: "Название", type: "text", required: true, maxLength: 60 },
          { key: "description", label: "Описание", type: "textarea", maxLength: 200 },
        ],
      },
    ],
  },

  // «Наша история» (обобщение «100 дней отношений», AGENTS.md §3a):
  // дата начала отношений + таймлайн + YouTube-видео.
  "nasha-istoriya": {
    slug: "nasha-istoriya",
    fields: [
      { key: "startDate", label: "Дата начала отношений", type: "date", required: true },
      { key: "youtubeUrl", label: "Ссылка на YouTube-видео", type: "url" },
    ],
    groups: [
      {
        key: "milestones",
        label: "События таймлайна",
        minItems: 1,
        maxItems: 5,
        photoPerItem: true,
        fields: [
          { key: "date", label: "Дата события", type: "date", required: true },
          { key: "text", label: "Что произошло", type: "textarea", required: true, maxLength: 200 },
        ],
      },
    ],
  },

  // «Признание в любви»: эффект печатной машинки + 3D-сердца на фоне.
  "priznanie-v-lyubvi": {
    slug: "priznanie-v-lyubvi",
    fields: [
      {
        key: "endingQuestion",
        label: "Финальный вопрос (после признания)",
        type: "text",
        maxLength: 100,
        placeholder: "Ты будешь со мной?",
      },
    ],
    groups: [
      {
        key: "lines",
        label: "Текст признания (построчно)",
        minItems: 1,
        maxItems: 5,
        photoPerItem: false,
        fields: [{ key: "text", label: "Строка", type: "textarea", required: true, maxLength: 150 }],
      },
    ],
  },

  // «Ты против меня» (Квиз): 5 вопросов, подсчёт очков, конфетти.
  "ty-protiv-menya": {
    slug: "ty-protiv-menya",
    fields: [{ key: "title", label: "Название квиза", type: "text", maxLength: 80 }],
    groups: [
      {
        key: "questions",
        label: "Вопросы",
        minItems: 5,
        maxItems: 5,
        photoPerItem: false,
        fields: [
          { key: "question", label: "Вопрос", type: "text", required: true, maxLength: 150 },
          { key: "optionA", label: "Вариант А", type: "text", required: true, maxLength: 80 },
          { key: "optionB", label: "Вариант Б", type: "text", required: true, maxLength: 80 },
          {
            key: "correctOption",
            label: "Правильный вариант (для подсчёта очков)",
            type: "select",
            required: true,
            options: [
              { value: "A", label: "Вариант А" },
              { value: "B", label: "Вариант Б" },
            ],
          },
        ],
      },
    ],
  },
};
