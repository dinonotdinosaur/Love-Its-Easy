import type { Metadata } from "next";

// AGENTS.md §7 (жёсткая граница): страницы квестов не индексируются и не краулятся.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function QuestLayout({ children }: LayoutProps<"/q">) {
  return children;
}
