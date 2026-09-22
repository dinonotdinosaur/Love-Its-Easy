import type { ComponentType } from "react";

import type { TemplateSlug } from "@/lib/tariffs";

import TyProtivMenya from "./ty-protiv-menya";
import TySamayaKrasivaya from "./ty-samaya-krasivaya";
import VyberiSvidanie from "./vyberi-svidanie";
import NashaIstoriya from "./nasha-istoriya";
import PriznanieVLyubvi from "./priznanie-v-lyubvi";
import type { TemplateProps } from "./types";

/** Реестр компонентов шаблонов — используется рендером `/q/[uuid]` (Фаза 9). */
export const TEMPLATE_COMPONENTS: Record<TemplateSlug, ComponentType<TemplateProps>> = {
  "ty-samaya-krasivaya": TySamayaKrasivaya,
  "vyberi-svidanie": VyberiSvidanie,
  "nasha-istoriya": NashaIstoriya,
  "priznanie-v-lyubvi": PriznanieVLyubvi,
  "ty-protiv-menya": TyProtivMenya,
};

export type { TemplateProps } from "./types";
