import Link from "next/link";
import { notFound } from "next/navigation";

import { getTariffFeatures, TARIFFS, TEMPLATE_SLUGS, isTemplateAllowedForTariff, type TariffId } from "@/lib/tariffs";

import { OrderForm } from "./OrderForm";

function isTariffId(value: string): value is TariffId {
  return value in TARIFFS;
}

export default async function OrderPage({ params }: PageProps<"/order/[tariff]">) {
  const { tariff: tariffParam } = await params;

  if (!isTariffId(tariffParam)) {
    notFound();
  }

  const tariff = TARIFFS[tariffParam];
  const features = getTariffFeatures(tariff.id);
  const allowedTemplates = TEMPLATE_SLUGS.filter((slug) => isTemplateAllowedForTariff(tariff.id, slug));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← Ко всем тарифам
      </Link>

      <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-white/5">
        <h1 className="text-2xl font-semibold">{tariff.title}</h1>
        <p className="mt-1 text-3xl font-bold">{tariff.priceRub}&nbsp;₽</p>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <span aria-hidden className="text-rose-500">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <OrderForm tariff={tariff} allowedTemplates={allowedTemplates} />
    </div>
  );
}
