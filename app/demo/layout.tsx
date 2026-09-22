import type { Metadata } from "next";

// Как и /q/[uuid] — не индексируем (AGENTS.md §7), демо расходится через
// прямые ссылки в шеринге, не через поиск.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return children;
}
