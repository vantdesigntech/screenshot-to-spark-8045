export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark";

/**
 * Only an explicit saved choice wins. Anything else (nothing saved, a corrupt
 * value) falls back to the default night look.
 */
export function resolveStoredTheme(stored: string | null): Theme | null {
  return stored === "dark" || stored === "light" ? stored : null;
}

/** Adds or removes the .dark class that every design token in styles.css reads. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

const STORAGE_KEY_LITERAL = JSON.stringify(THEME_STORAGE_KEY);

/**
 * Runs before the first paint so a saved night mode never flashes the cream
 * theme. It has to be inlined in the document head, so it lives as a string.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var t=localStorage.getItem(${STORAGE_KEY_LITERAL});document.documentElement.classList.toggle("dark",t!=="light");}catch(e){}})();`;
