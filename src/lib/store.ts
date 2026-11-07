// React yeniden çizimi olmadan paylaşılan, kare başına güncellenen durum.
import type { CalloutId } from "./content";

export const scrollState = { p: 0 };

export type CalloutEls = {
  line: SVGLineElement;
  dot: SVGCircleElement;
  ring: SVGCircleElement;
  label: HTMLDivElement;
};

export const calloutEls = new Map<CalloutId, CalloutEls>();
