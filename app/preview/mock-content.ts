import type { ResolvedPageContent } from "@/lib/order-content";
import type { TemplateSlug } from "@/lib/tariffs";

/** Локальная SVG-заглушка вместо внешнего сервиса — превью не должно зависеть от интернета. */
function photo(seed: string): string {
  const hue = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'><rect width='100%' height='100%' fill='hsl(${hue},70%,85%)'/><text x='50%' y='50%' font-size='120' text-anchor='middle' dominant-baseline='middle' fill='hsl(${hue},70%,45%)'>♥</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Заглушечный контент для визуальной проверки шаблонов без реального
 * заказа/оплаты (Фаза 9 ещё не собрана). Используется только страницей
 * `/preview/[template]` — не показывается настоящим пользователям.
 * Фото уже разрешены в URL (см. templates/types.ts — серверный компонент
 * не может передать клиентскому функцию-резолвер).
 */
export const PREVIEW_CONTENT: Record<TemplateSlug, ResolvedPageContent> = {
  "ty-samaya-krasivaya": {
    templateSlug: "ty-samaya-krasivaya",
    fields: { finalMessage: "И это правда ещё не все причины — просто дальше уже не поместилось :)" },
    groups: {
      cards: [
        { fields: { text: "Твоя улыбка — моё любимое место на земле" }, photoUrl: photo("card-1") },
        { fields: { text: "Ты самая добрая из всех, кого я знаю" }, photoUrl: photo("card-2") },
        { fields: { text: "С тобой даже дождливый день — праздник" }, photoUrl: photo("card-3") },
        { fields: { text: "Ты вдохновляешь меня быть лучше" }, photoUrl: photo("card-4") },
      ],
    },
  },

  "vyberi-svidanie": {
    templateSlug: "vyberi-svidanie",
    fields: { question: "Пойдёшь со мной на свидание?", finalMessage: "Жду тебя! 💕" },
    groups: {
      dateOptions: [
        { fields: { title: "Ужин при свечах", description: "Столик в нашем любимом ресторане" } },
        { fields: { title: "Прогулка у моря", description: "Закат и мороженое" } },
      ],
    },
  },

  "nasha-istoriya": {
    templateSlug: "nasha-istoriya",
    fields: { startDate: "2023-02-14", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    groups: {
      milestones: [
        { fields: { date: "2023-02-14", text: "Первое свидание" }, photoUrl: photo("milestone-1") },
        { fields: { date: "2023-08-01", text: "Первое совместное путешествие" }, photoUrl: photo("milestone-2") },
        { fields: { date: "2024-12-31", text: "Встретили Новый год вдвоём" } },
      ],
    },
  },

  "priznanie-v-lyubvi": {
    templateSlug: "priznanie-v-lyubvi",
    fields: { endingQuestion: "Ты будешь со мной?" },
    groups: {
      lines: [
        { fields: { text: "Каждый день с тобой — подарок." } },
        { fields: { text: "Ты делаешь мою жизнь ярче." } },
        { fields: { text: "Я люблю тебя больше, чем вчера." } },
      ],
    },
  },

  "ty-protiv-menya": {
    templateSlug: "ty-protiv-menya",
    fields: { title: "Тест на знание меня" },
    groups: {
      questions: [
        {
          fields: { question: "Мой любимый цвет?", optionA: "Синий", optionB: "Красный", correctOption: "A" },
        },
        {
          fields: { question: "Любимое время года?", optionA: "Зима", optionB: "Лето", correctOption: "B" },
        },
        {
          fields: { question: "Кошки или собаки?", optionA: "Кошки", optionB: "Собаки", correctOption: "A" },
        },
        {
          fields: { question: "Чай или кофе?", optionA: "Чай", optionB: "Кофе", correctOption: "B" },
        },
        {
          fields: { question: "Горы или море?", optionA: "Горы", optionB: "Море", correctOption: "B" },
        },
      ],
    },
  },
};
