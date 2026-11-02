import { describe, expect, it } from "vitest";
import { countActiveFilters } from "@/lib/filter-count";
import { listTotalEur } from "@/lib/mi-caja";

describe("filter counter", () => {
  it("is 0 with defaults", () => {
    expect(countActiveFilters({ origin: "all", categories: [], storeFilter: "all", maxPrice: 500, maxPriceLimit: 500 })).toBe(0);
  });
  it("counts each category plus origin, store and price", () => {
    expect(countActiveFilters({ origin: "oem", categories: ["crystal", "strap"], storeFilter: "eBay", maxPrice: 100, maxPriceLimit: 500 })).toBe(5);
  });
});

describe("shopping list total", () => {
  it("multiplies price by quantity", () => {
    expect(listTotalEur([{ price_eur: 12.5, quantity: 2 }, { price_eur: 3.1, quantity: 1 }])).toBe(28.1);
  });
});
