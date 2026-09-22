"use client";

import { useSyncExternalStore } from "react";

/**
 * Three.js — только через dynamic import и только когда есть смысл его
 * грузить: WebGL поддерживается и пользователь не просил меньше анимации
 * (AGENTS.md §2 — Mobile First, 3D не должно ломать перформанс на слабых
 * телефонах). useSyncExternalStore — чтобы SSR-снапшот (`false`) не
 * триггерил предупреждение о гидратации и не требовал setState в эффекте.
 */
function subscribe() {
  return () => {};
}

function getSnapshot(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function useCanAnimate3d(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
