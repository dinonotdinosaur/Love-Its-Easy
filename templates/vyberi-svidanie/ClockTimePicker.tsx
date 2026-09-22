"use client";

import { useRef, useState } from "react";

const HOUR_LABELS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));
const MINUTE_LABELS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 78;

function polarPosition(index: number) {
  const angle = (index * 30 - 90) * (Math.PI / 180);
  return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
}

function indexFromPoint(x: number, y: number) {
  const angle = (Math.atan2(y - CENTER, x - CENTER) * 180) / Math.PI + 90;
  const normalized = ((angle % 360) + 360) % 360;
  return Math.round(normalized / 30) % 12;
}

export interface ClockTime {
  hour: number; // 0-23
  minute: number; // 0-59
}

/**
 * Аналоговый циферблат вместо системного `<input type="time">` — сначала
 * настраивается час (тап/перетаскивание по кругу), затем автоматически
 * переключается на минуты (шаг 5 минут — для "во сколько встречаемся"
 * этого достаточно, зато выглядит как настоящие часы).
 */
export function ClockTimePicker({
  value,
  onChange,
}: {
  value: ClockTime;
  onChange: (value: ClockTime) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const draggingRef = useRef(false);

  const period: "AM" | "PM" = value.hour >= 12 ? "PM" : "AM";
  const hour12 = value.hour % 12 === 0 ? 12 : value.hour % 12;

  function applyPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * SIZE;
    const y = ((clientY - rect.top) / rect.height) * SIZE;
    const index = indexFromPoint(x, y);

    if (mode === "hour") {
      const displayHour = index === 0 ? 12 : index;
      const hour24 = period === "PM" ? (displayHour % 12) + 12 : displayHour % 12;
      onChange({ ...value, hour: hour24 });
    } else {
      onChange({ ...value, minute: index * 5 });
    }
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    applyPoint(event.clientX, event.clientY);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!draggingRef.current) return;
    applyPoint(event.clientX, event.clientY);
  }

  function handlePointerUp() {
    if (draggingRef.current && mode === "hour") {
      setMode("minute");
    }
    draggingRef.current = false;
  }

  function setPeriod(next: "AM" | "PM") {
    if (next === period) return;
    onChange({ ...value, hour: next === "PM" ? (value.hour % 12) + 12 : value.hour % 12 });
  }

  const labels = mode === "hour" ? HOUR_LABELS : MINUTE_LABELS;
  const selectedIndex = mode === "hour" ? hour12 % 12 : value.minute / 5;
  const handPos = polarPosition(selectedIndex);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-3xl font-semibold">
        <button
          type="button"
          onClick={() => setMode("hour")}
          className={mode === "hour" ? "text-rose-500" : "text-zinc-400"}
        >
          {String(hour12).padStart(2, "0")}
        </button>
        <span className="text-zinc-400">:</span>
        <button
          type="button"
          onClick={() => setMode("minute")}
          className={mode === "minute" ? "text-rose-500" : "text-zinc-400"}
        >
          {String(value.minute).padStart(2, "0")}
        </button>
        <div className="ml-2 flex flex-col text-xs font-medium">
          <button
            type="button"
            onClick={() => setPeriod("AM")}
            className={period === "AM" ? "text-rose-500" : "text-zinc-400"}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => setPeriod("PM")}
            className={period === "PM" ? "text-rose-500" : "text-zinc-400"}
          >
            PM
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="touch-none select-none rounded-full bg-rose-50 dark:bg-white/5"
      >
        <line
          x1={CENTER}
          y1={CENTER}
          x2={handPos.x}
          y2={handPos.y}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          className="text-rose-400"
        />
        <circle cx={CENTER} cy={CENTER} r={4} className="fill-rose-500" />
        {labels.map((label, index) => {
          const pos = polarPosition(index);
          const isSelected = index === selectedIndex;
          return (
            <g key={label}>
              {isSelected && <circle cx={pos.x} cy={pos.y} r={16} className="fill-rose-500" />}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={
                  isSelected
                    ? "fill-white text-sm font-semibold"
                    : "fill-zinc-600 text-sm dark:fill-zinc-300"
                }
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="text-xs text-zinc-400">
        {mode === "hour" ? "Выбери час" : "Выбери минуты"}
      </p>
    </div>
  );
}
