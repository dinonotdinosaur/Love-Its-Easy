/**
 * Дата из `<input type="date">` ("YYYY-MM-DD") как ЛОКАЛЬНАЯ полночь.
 * `new Date("2024-03-15")` — это полночь по UTC, и западнее UTC она
 * превращается в 14 марта. `null` — если строка не в этом формате.
 */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "15 марта 2024 г." — для дат событий таймлайна; исходная строка, если не разобрать. */
export function formatRuDate(value: string): string {
  const date = parseLocalDate(value);
  return date
    ? date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    : value;
}

/** Прибавляет месяцы, прижимая день к концу месяца (31 января + 1 месяц = 28/29 февраля). */
function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(date.getDate(), lastDay));
}

function wholeDaysBetween(from: Date, to: Date): number {
  // Через UTC-даты, чтобы переход на летнее время не давал 23/25-часовых суток.
  const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/**
 * "X лет Y месяцев Z дней" с начала отношений — AGENTS.md §3a (обобщение
 * "100 дней отношений"). Пустая строка — дата не разобрана или в будущем.
 */
export function formatTogetherDuration(startDate: string, now: Date = new Date()): string {
  const start = parseLocalDate(startDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!start || start > today) return "";

  // Полные месяцы, затем остаток в днях от "юбилея" последнего месяца. Прежняя
  // арифметика по компонентам давала отрицательные дни на концах месяцев
  // (31 января -> 1 марта = "1 месяц -2 дня").
  let totalMonths =
    (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
  if (addMonthsClamped(start, totalMonths) > today) totalMonths -= 1;
  const days = wholeDaysBetween(addMonthsClamped(start, totalMonths), today);

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${pluralRu(years, ["год", "года", "лет"])}`);
  if (months > 0) parts.push(`${months} ${pluralRu(months, ["месяц", "месяца", "месяцев"])}`);
  if (years === 0 && (months === 0 || days > 0)) {
    parts.push(`${days} ${pluralRu(days, ["день", "дня", "дней"])}`);
  }

  return totalMonths === 0 && days === 0 ? "сегодня начало" : parts.join(" ");
}

function pluralRu(n: number, [one, few, many]: [string, string, string]): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Поддерживает youtube.com/watch?v=, youtu.be/, youtube.com/embed/, youtube.com/shorts/. */
export function extractYoutubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  const [first, second] = parsed.pathname.split("/").filter(Boolean);
  let id: string | null | undefined = null;

  if (host === "youtu.be") {
    id = first;
  } else if (host === "youtube.com") {
    id = first === "embed" || first === "shorts" ? second : parsed.searchParams.get("v");
  }

  // ID подставляется в src iframe/картинки — принимаем только настоящий формат.
  return id && YOUTUBE_ID_RE.test(id) ? id : null;
}
