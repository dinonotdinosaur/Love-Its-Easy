"use client";

import { useEffect, useState } from "react";

/** Построчный эффект печатной машинки — печатает line[i], пауза, следующая строка. */
export function Typewriter({ lines }: { lines: string[] }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    if (lines.length === 0) return;
    const currentLine = lines[lineIndex] ?? "";

    if (text.length < currentLine.length) {
      const timeout = setTimeout(() => setText(currentLine.slice(0, text.length + 1)), 45);
      return () => clearTimeout(timeout);
    }

    if (lineIndex < lines.length - 1) {
      const timeout = setTimeout(() => {
        setLineIndex((i) => i + 1);
        setText("");
      }, 1600);
      return () => clearTimeout(timeout);
    }
  }, [text, lineIndex, lines]);

  return (
    <p className="min-h-[3em] text-2xl font-semibold sm:text-3xl">
      {text}
      <span className="animate-pulse">|</span>
    </p>
  );
}
