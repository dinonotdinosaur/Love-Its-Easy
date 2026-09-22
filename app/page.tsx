import Link from "next/link";

import { TariffCard } from "@/app/_components/TariffCard";
import { BASE_TARIFFS, SECONDARY_TARIFFS, TEMPLATE_TITLES } from "@/lib/tariffs";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <span className="text-lg font-semibold">love its easy</span>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 pb-24 sm:px-6">
        <section className="flex flex-col gap-4 pt-8 text-center sm:pt-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Сюрприз для второй половинки за пару минут
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Выбираешь шаблон, заполняешь текстом и фото, оплачиваешь — получаешь
            свою ссылку на готовый мини-сайт с квестом или признанием. Без
            визуального конструктора и без подписок.
          </p>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-center text-2xl font-semibold">Тарифы</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <TariffCard tariff={BASE_TARIFFS.legkiy} />
            <TariffCard tariff={BASE_TARIFFS.kvest} highlighted />
            <TariffCard tariff={BASE_TARIFFS.maksimum} />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Другие форматы</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Не часть основной линейки — отдельные форматы под конкретный повод.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <TariffCard tariff={SECONDARY_TARIFFS["dlya-dvoikh"]} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-center text-2xl font-semibold">Шаблоны</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(TEMPLATE_TITLES).map((title) => (
              <div
                key={title}
                className="rounded-xl border border-black/10 bg-white px-4 py-3 dark:border-white/15 dark:bg-white/5"
              >
                {title}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center gap-2 border-t border-black/10 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/10 sm:px-6">
        <div className="flex gap-4">
          <Link href="/oferta" className="hover:underline">
            Оферта
          </Link>
          <Link href="/privacy" className="hover:underline">
            Конфиденциальность
          </Link>
          <Link href="/takedown" className="hover:underline">
            Удаление фото
          </Link>
        </div>
        <p>© {new Date().getFullYear()} loveitseasy</p>
      </footer>
    </div>
  );
}
