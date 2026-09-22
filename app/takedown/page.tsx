import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Запрос на удаление фото — loveitseasy",
  description: "Форма для людей, изображённых на фото в чужом квесте, которые хотят потребовать удаления изображения.",
};

const SUPPORT_EMAIL = "support@loveitseasy.ru";

export default function TakedownPage() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Запрос на удаление фото",
  )}&body=${encodeURIComponent(
    "Ссылка на квест (если известна): \nОписание фото, которое нужно удалить: \nВаши контактные данные для связи: ",
  )}`;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        ← На главную
      </Link>

      <h1 className="text-2xl font-bold">Вы на фото в чужом квесте?</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Если кто-то создал на loveitseasy.ru сюрприз с вашей фотографией без вашего
        согласия, вы вправе потребовать её удаления. Мы рассматриваем такие обращения в
        приоритетном порядке.
      </p>

      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Напишите нам на почту — по возможности приложите ссылку на квест (адрес вида{" "}
          <code className="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">
            loveitseasy.ru/q/...
          </code>
          ) и опишите, какое именно фото нужно удалить.
        </p>
        <a
          href={mailtoHref}
          className="flex h-12 items-center justify-center rounded-full bg-rose-500 px-6 font-medium text-white transition-colors hover:bg-rose-600"
        >
          Написать на {SUPPORT_EMAIL}
        </a>
      </div>

      <p className="text-sm text-zinc-500">
        После подтверждения запроса мы удалим фотографию из квеста в кратчайшие сроки.
        Владелец заказа не теряет право на сам сюрприз — мы предложим ему бесплатно
        заменить фото.
      </p>
    </div>
  );
}
