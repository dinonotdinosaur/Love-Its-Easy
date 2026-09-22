"use client";

import { makeEmptyPageContent, type GroupItemContent, type PageContent } from "@/lib/order-content";
import { TEMPLATE_FIELD_SCHEMAS, type SimpleField } from "@/lib/template-fields";
import { TEMPLATE_TITLES, type TemplateSlug } from "@/lib/tariffs";

import { PhotoUploadField } from "./PhotoUploadField";

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: SimpleField;
  value: string;
  onChange: (value: string) => void;
}) {
  const commonProps = {
    id: field.key,
    required: field.required,
    maxLength: field.maxLength,
    placeholder: field.placeholder,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    className:
      "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5",
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={field.key} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-rose-500"> *</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea {...commonProps} rows={3} />
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
}: {
  label?: string;
  allowedTemplates: TemplateSlug[];
  page: PageContent;
  onChange: (page: PageContent) => void;
  photosAllowed: boolean;
  consentGiven: boolean;
}) {
  const schema = TEMPLATE_FIELD_SCHEMAS[page.templateSlug as TemplateSlug];

  function setField(key: string, value: string) {
    onChange({ ...page, fields: { ...page.fields, [key]: value } });
  }

  function setGroupItem(groupKey: string, index: number, item: GroupItemContent) {
    const items = [...(page.groups[groupKey] ?? [])];
    items[index] = item;
    onChange({ ...page, groups: { ...page.groups, [groupKey]: items } });
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-white/5">
      {label && <h3 className="font-semibold">{label}</h3>}

      <div className="flex flex-col gap-1">
        <label htmlFor={`${page.templateSlug}-template`} className="text-sm font-medium">
          Шаблон
        </label>
        <select
          id={`${page.templateSlug}-template`}
          value={page.templateSlug}
          onChange={(e) => onChange(makeEmptyPageContent(e.target.value))}
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
                  field={{ ...field, required: field.required && index < group.minItems }}
                  value={item.fields[field.key] ?? ""}
                  onChange={(value) =>
                    setGroupItem(group.key, index, {
                      ...item,
                      fields: { ...item.fields, [field.key]: value },
                    })
                  }
                />
              ))}
              {group.photoPerItem && photosAllowed && (
                <PhotoUploadField
                  value={item.photoKey}
                  disabled={!consentGiven}
                  onChange={(key) => setGroupItem(group.key, index, { ...item, photoKey: key })}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
