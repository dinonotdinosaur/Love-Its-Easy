import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TEMPLATE_SLUGS, type TemplateSlug } from "@/lib/tariffs";
import { TEMPLATE_COMPONENTS } from "@/templates";

import { PREVIEW_CONTENT } from "../mock-content";

export const metadata: Metadata = { robots: { index: false, follow: false } };

function isTemplateSlug(value: string): value is TemplateSlug {
  return (TEMPLATE_SLUGS as readonly string[]).includes(value);
}

export default async function PreviewTemplatePage({ params }: PageProps<"/preview/[template]">) {
  const { template } = await params;

  if (!isTemplateSlug(template)) {
    notFound();
  }

  const Component = TEMPLATE_COMPONENTS[template];
  return <Component page={PREVIEW_CONTENT[template]} />;
}
