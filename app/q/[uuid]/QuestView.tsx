"use client";

import { useCallback, useState } from "react";

import type { ResolvedPageContent } from "@/lib/order-content";
import { TEMPLATE_COMPONENTS } from "@/templates";

import { ShareButton } from "./ShareButton";

export function QuestView({
  pages,
  uuid,
  multiPage,
}: {
  pages: ResolvedPageContent[];
  uuid: string;
  multiPage: boolean;
}) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const allDone = pages.length > 0 && completed.size === pages.length;

  const markComplete = useCallback((index: number) => {
    setCompleted((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
  }, []);

  return (
    <div className="flex flex-col gap-12 py-8">
      {pages.map((page, index) => {
        const Component = TEMPLATE_COMPONENTS[page.templateSlug as keyof typeof TEMPLATE_COMPONENTS];
        if (!Component) return null;

        return (
          <section key={index} className="flex flex-col gap-4">
            {multiPage && (
              <h2 className="text-center text-sm font-medium uppercase tracking-widest text-zinc-400">
                Страница {index + 1}
              </h2>
            )}
            <Component page={page} onComplete={() => markComplete(index)} />
          </section>
        );
      })}

      {allDone && <ShareButton uuid={uuid} />}
    </div>
  );
}
