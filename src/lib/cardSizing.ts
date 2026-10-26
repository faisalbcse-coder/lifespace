export interface SectionCardSize {
  width?: number;
  height?: number;
  isFullWidth?: boolean;
}

export const MIN_CARD_HEIGHT = 260;
export const MAX_CARD_HEIGHT = 1200;
export const DEFAULT_CARD_HEIGHT = 415;

export const MIN_CARD_WIDTH = 280;
export const STORAGE_KEY = "lifespace_global_card_size";

/**
 * Loads the unified/global card size from localStorage safely.
 * When any card size is changed, all cards inherit this size.
 */
export function loadSavedCardSize(): SectionCardSize {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      // In case previous per-section format existed, grab the first entry
      if (!("width" in parsed) && !("height" in parsed) && !("isFullWidth" in parsed)) {
        const firstVal = Object.values(parsed)[0] as SectionCardSize | undefined;
        return firstVal || {};
      }
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Saves the unified/global card size to localStorage.
 */
export function saveCardSize(size: SectionCardSize): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Clears the saved card size from localStorage.
 */
export function clearSavedCardSize(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("lifespace_section_card_sizes");
  } catch {
    // Ignore storage quota errors
  }
}
