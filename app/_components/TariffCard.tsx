import Link from "next/link";

import { getTariffFeatures, type TariffConfig } from "@/lib/tariffs";

export function TariffCard({
  tariff,
  highlighted = false,
}: {
  tariff: TariffConfig;
  highlighted?: boolean;
}) {
  const features = getTariffFeatures(tariff.id);

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-6 ${
        highlighted
          ? "border-rose-400 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/30"
          : "border-black/10 bg-white dark:border-white/15 dark:bg-white/5"
      }`}
    >
      <div>
        <h3 className="text-lg font-semibold">{tariff.title}</h3>
        <p className="mt-1 text-3xl font-bold">
          {tariff.priceRub}&nbsp;₽
        </p>
      </div>
      <ul className="flex flex-1 flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span aria-hidden className="text-rose-500">
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={`/order/${tariff.id}`}
        className="mt-2 flex h-11 items-center justify-center rounded-full bg-rose-500 px-5 font-medium text-white transition-colors hover:bg-rose-600"
      >
        Выбрать
      </Link>
    </div>
  );
}
