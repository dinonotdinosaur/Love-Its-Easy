"use client";

import { useEffect, useState } from "react";

const CHAR_DELAY_MS = 70;
const LINE_PAUSE_MS = 2000;

/** Построчный эффект печатной машинки — печатает line[i], пауза, следующая строка. */
export function Typewriter({ lines, onDone }: { lines: string[]; onDone?: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (lines.length === 0) return;
    const currentLine = lines[lineIndex] ?? "";

    if (text.length < currentLine.length) {
      const timeout = setTimeout(() => setText(currentLine.slice(0, text.length + 1)), CHAR_DELAY_MS);
      return () => clearTimeout(timeout);
    }

    if (lineIndex < lines.length - 1) {
      const timeout = setTimeout(() => {
        setLineIndex((i) => i + 1);
        setText("");
      }, LINE_PAUSE_MS);
      return () => clearTimeout(timeout);
    }

    if (!done) {
      const timeout = setTimeout(() => {
        setDone(true);
        onDone?.();
      }, 900);
      return () => clearTimeout(timeout);
    }
  }, [text, lineIndex, lines, done, onDone]);

  return (
    <p className="min-h-[3em] text-2xl font-semibold sm:text-3xl">
      {text}
      {!done && <span className="animate-pulse">|</span>}
    </p>
  );
}
