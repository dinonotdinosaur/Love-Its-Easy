"use client";

import { useId } from "react";

import { makeEmptyPageContent, type GroupItemContent, type PageContent } from "@/lib/order-content";
import { TEMPLATE_FIELD_SCHEMAS, type SimpleField } from "@/lib/template-fields";
import { TEMPLATE_TITLES, type TemplateSlug } from "@/lib/tariffs";

import { PhotoUploadField } from "./PhotoUploadField";

function FieldInput({
  id,
  field,
  value,
  onChange,
}: {
  /** Уникальный на странице: одни и те же field.key повторяются в каждом пункте группы и на каждой странице заказа. */
  id: string;
  field: SimpleField;
  value: string;
  onChange: (value: string) => void;
}) {
  const commonProps = {
    id,
    required: field.required,
    maxLength: field.maxLength,
    placeholder: field.placeholder,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    className:
      "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5",
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-rose-500"> *</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea {...commonProps} rows={3} />
      ) : field.type === "select" ? (
        <select {...commonProps}>
          <option value="" disabled>
            Выберите…
          </option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input {...commonProps} type={field.type} />
      )}
    </div>
  );
}

export function TemplatePageForm({
  label,
  allowedTemplates,
  page,
  onChange,
  photosAllowed,
  consentGiven,
  onUploadingChange,
}: {
  label?: string;
  allowedTemplates: TemplateSlug[];
  page: PageContent;
  /**
   * Принимает функцию-апдейтер, а не готовую страницу: загрузка фото
   * асинхронная, и к её окончанию `page` из замыкания уже устарел — две
   * параллельные загрузки затирали фото друг друга, а загрузка, завершившаяся
   * после смены шаблона, откатывала форму на старый шаблон.
   */
  onChange: (update: (prev: PageContent) => PageContent) => void;
  photosAllowed: boolean;
  consentGiven: boolean;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const schema = TEMPLATE_FIELD_SCHEMAS[page.templateSlug as TemplateSlug];
  const templateSlug = page.templateSlug;
  const idPrefix = useId();

  function setField(key: string, value: string) {
    onChange((prev) => ({ ...prev, fields: { ...prev.fields, [key]: value } }));
  }

  function updateGroupItem(
    groupKey: string,
    index: number,
    update: (item: GroupItemContent) => GroupItemContent,
  ) {
    onChange((prev) => {
      // Шаблон успели сменить (например, пока грузилось фото) — это
      // изменение относится к уже выброшенному контенту.
      if (prev.templateSlug !== templateSlug) return prev;
      const items = [...(prev.groups[groupKey] ?? [])];
      items[index] = update(items[index] ?? { fields: {} });
      return { ...prev, groups: { ...prev.groups, [groupKey]: items } };
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      {label && <h3 className="font-semibold">{label}</h3>}

      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-template`} className="text-sm font-medium">
          Шаблон
        </label>
        <select
          id={`${idPrefix}-template`}
          value={page.templateSlug}
          onChange={(e) => {
            const slug = e.target.value;
            onChange(() => makeEmptyPageContent(slug));
          }}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5"
        >
          {allowedTemplates.map((slug) => (
            <option key={slug} value={slug}>
              {TEMPLATE_TITLES[slug]}
            </option>
          ))}
        </select>
      </div>

      {schema.fields.map((field) => (
        <FieldInput
          key={field.key}
          id={`${idPrefix}-${field.key}`}
          field={field}
          value={page.fields[field.key] ?? ""}
          onChange={(value) => setField(field.key, value)}
        />
      ))}

      {schema.groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {group.label} ({group.minItems}
            {group.minItems !== group.maxItems ? `–${group.maxItems}` : ""})
          </h4>
          {(page.groups[group.key] ?? []).map((item, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-xl border border-black/10 p-3 dark:border-white/10"
            >
              <span className="text-xs text-zinc-400">
                {index < group.minItems ? `Пункт ${index + 1} *` : `Пункт ${index + 1} (опционально)`}
              </span>
              {group.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  id={`${idPrefix}-${group.key}-${index}-${field.key}`}
                  field={{ ...field, required: field.required && index < group.minItems }}
                  value={item.fields[field.key] ?? ""}
                  onChange={(value) =>
                    updateGroupItem(group.key, index, (prev) => ({
                      ...prev,
                      fields: { ...prev.fields, [field.key]: value },
                    }))
                  }
                />
              ))}
              {group.photoPerItem && photosAllowed && (
                <PhotoUploadField
                  value={item.photoKey}
                  disabled={!consentGiven}
                  onChange={(key) =>
                    updateGroupItem(group.key, index, (prev) => ({ ...prev, photoKey: key }))
                  }
                  onUploadingChange={onUploadingChange}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
