/** "X лет Y месяцев Z дней" с начала отношений — AGENTS.md §3a (обобщение "100 дней отношений"). */
export function formatTogetherDuration(startDate: string, now: Date = new Date()): string {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${pluralRu(years, ["год", "года", "лет"])}`);
  if (months > 0) parts.push(`${months} ${pluralRu(months, ["месяц", "месяца", "месяцев"])}`);
  if (years === 0 && (months === 0 || days > 0)) {
    parts.push(`${days} ${pluralRu(days, ["день", "дня", "дней"])}`);
  }

  return parts.join(" ") || "сегодня начало";
}

function pluralRu(n: number, [one, few, many]: [string, string, string]): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** Поддерживает youtube.com/watch?v=, youtu.be/, youtube.com/embed/. */
export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.replace("/embed/", "") || null;
      }
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}
