/** Склонение русских существительных по числу (1 день / 2 дня / 5 дней). */
export function ruPlural(n: number, [one, few, many]: [string, string, string]): string {
  const mod100 = n % 100;
  const mod10 = n % 10;

  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/** "7 дней" / "1 год" / "3 года" — годы вместо дней, когда делится ровно. */
export function formatLinkDuration(days: number): string {
  if (days % 365 === 0) {
    const years = days / 365;
    return `${years} ${ruPlural(years, ["год", "года", "лет"])}`;
  }
  return `${days} ${ruPlural(days, ["день", "дня", "дней"])}`;
}
