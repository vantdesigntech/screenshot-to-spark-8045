import { readFileSync } from "node:fs";
import path from "node:path";

import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
  applyTheme,
  resolveStoredTheme,
} from "@/lib/theme";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";

const root = document.documentElement;

afterEach(() => {
  root.classList.remove("dark");
  localStorage.clear();
});

describe("Night mode theme choice", () => {
  it("only trusts an explicit saved value", () => {
    expect(resolveStoredTheme("dark")).toBe("dark");
    expect(resolveStoredTheme("light")).toBe("light");
    expect(resolveStoredTheme(null)).toBeNull();
    expect(resolveStoredTheme("banana")).toBeNull();
  });

  it("applyTheme switches the .dark class on and off", () => {
    applyTheme("dark");
    expect(root.classList.contains("dark")).toBe(true);
    applyTheme("light");
    expect(root.classList.contains("dark")).toBe(false);
  });

  it("the pre-paint script restores night mode and otherwise leaves the cream theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(root.classList.contains("dark")).toBe(true);

    root.classList.remove("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(root.classList.contains("dark")).toBe(false);

    root.classList.remove("dark");
    localStorage.clear();
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(root.classList.contains("dark")).toBe(false);
  });

  it("the toggler flips the site to night mode and remembers it", async () => {
    render(<AnimatedThemeToggler variant="square" />);
    const button = document.querySelector("button") as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(button);
    });

    expect(root.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(root.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("every colour token used by the light theme also has a night-mode value", () => {
    const css = readFileSync(
      path.resolve(process.cwd(), "src/styles.css"),
      "utf8",
    );

    const tokensIn = (selector: string) => {
      const pattern = new RegExp(`(^|\\n)\\s*${selector}\\s*\\{([^}]*)\\}`, "g");
      const found = new Set<string>();
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(css)) !== null) {
        const body = match[2] ?? "";
        for (const declaration of body.split(";")) {
          const trimmed = declaration.trim();
          if (trimmed.startsWith("--")) {
            found.add(trimmed.slice(0, trimmed.indexOf(":")).trim());
          }
        }
      }
      return found;
    };

    const lightTokens = tokensIn(":root");
    const darkTokens = tokensIn("\\.dark");

    expect(lightTokens.size).toBeGreaterThan(10);
    const missing = [...lightTokens].filter((token) => !darkTokens.has(token));
    expect(missing).toEqual([]);
  });
});
