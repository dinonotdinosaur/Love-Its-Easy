"use client";

import { useEffect, useState } from "react";

export function PhotoUploadField({
  value,
  onChange,
  onUploadingChange,
  disabled,
}: {
  value?: string;
  onChange: (key: string | undefined) => void;
  /** Форма блокирует отправку и смену шаблона, пока идёт загрузка. */
  onUploadingChange: (uploading: boolean) => void;
  disabled?: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // blob-URL держит файл в памяти, пока его явно не освободят — освобождаем
  // предыдущий при замене/удалении превью и последний при размонтировании.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    onUploadingChange(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { key?: string; error?: string };
      if (!res.ok || !data.key) {
        throw new Error(data.error ?? "Не удалось загрузить фото");
      }
      onChange(data.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фото");
      setPreviewUrl(null);
      onChange(undefined);
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  function handleRemove() {
    setPreviewUrl(null);
    setError(null);
    onChange(undefined);
  }

  return (
    <div className="flex items-center gap-3">
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- локальный blob-превью, не оптимизируется next/image
        <img src={previewUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-black/20 text-xs text-zinc-400 dark:border-white/20">
          Фото
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="cursor-pointer text-sm font-medium text-rose-600 hover:underline dark:text-rose-400">
          {value ? "Заменить" : "Добавить фото"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled || uploading}
            onChange={handleFileChange}
          />
        </label>
        {value && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-left text-xs text-zinc-500 hover:underline"
          >
            Убрать
          </button>
        )}
        {uploading && <span className="text-xs text-zinc-500">Загрузка…</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
