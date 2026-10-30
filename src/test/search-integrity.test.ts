import { afterEach, describe, expect, it, vi } from "vitest";
import { detectListingBrand, detectWatchPartCategory, parseEbayListings, parseListingPrice, searchLiveWatchPartsCloud, SEARCH_SERVER_TIMEOUT_MS } from "@/lib/live-watch-engine";
import { fetchLivePartsFromApi, filterParts, PARTS, SEARCH_CLIENT_TIMEOUT_MS } from "@/lib/parts";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const listing = (title: string, price: string, id = "123456789012") => `<li id="item-${id}"><h3>${title}</h3><img src="https://example.com/listing.jpg" alt="${title}"><span class="price">${price}</span></li>`;

describe("Search integrity", () => {
  it("returns an empty list when all sources have no results", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(url.includes("suggest.json") ? '{"resources":{"results":{"products":[]}}}' : "<html></html>")));
    const result = await searchLiveWatchPartsCloud("unknown-part-xyz");
    expect(result.items).toEqual([]);
    expect(result.sources).toHaveLength(4);
    expect(result.sources.every((source) => source.status === "ok" && source.count === 0)).toBe(true);
  });

  it("never returns Seiko products for a Rolex query in live or catalog results", () => {
    const html = listing("Seiko SKX007 crystal", "€27.31") + listing("Rolex crystal", "€73.21", "223456789012");
    const result = parseEbayListings(html, "Rolex crystal");
    expect(result.map((p) => p.title)).toEqual(["Rolex crystal"]);
    const catalog = filterParts(PARTS, { query: "Rolex", origin: "all", categories: [], maxPrice: 25000 });
    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog.some((p) => /seiko/i.test(`${p.title} ${p.brand}`))).toBe(false);
  });

  it("discards missing or unreadable prices and currency rather than inserting fallback amounts", () => {
    const html = ["", "contact seller", "45", "68", "95", "42", "18.9"].map((price) => listing("Rolex crystal", price)).join("");
    expect(parseEbayListings(html, "Rolex crystal")).toEqual([]);
    const valid = parseEbayListings(listing("Rolex crystal", "€73.21"), "Rolex crystal");
    expect(valid.map((p) => p.priceEur)).toEqual([73.21]);
  });

  it("uses the currency attached to the listing price, not another symbol on the page", () => {
    expect(parseListingPrice("$100.00")).toEqual({ listedPrice: 100, listedCurrency: "USD", priceEur: 92 });
    expect(parseListingPrice("£100.00")).toEqual({ listedPrice: 100, listedCurrency: "GBP", priceEur: 118 });
    expect(parseListingPrice("1.234,56 €")?.priceEur).toBe(1234.56);
    expect(parseListingPrice(100)).toBeNull();
  });

  it("does not invent compatibility or OEM references and identifies brand only from title", () => {
    const [part] = parseEbayListings(listing("Rolex sapphire crystal", "€73.21"), "Rolex 124300 crystal");
    expect(part?.compatibleWith).toEqual([]);
    expect(part?.oemRef).toBeUndefined();
    expect(part?.brand).toBe("Rolex");
    expect(detectListingBrand("20mm leather strap")).toBe("Sin identificar");
  });

  it.each([
    ["Rolex Oyster crystal", "crystals"], ["Seiko NH35 dial", "dials"],
    ["Rolex Jubilee bezel", "bezels"], ["ETA crown", "crowns"],
    ["metadata", "straps"], ["jubilee", "straps"], ["eta", "straps"],
    ["cristal", "crystals"], ["bisel", "bezels"], ["corona", "crowns"],
    ["esfera", "dials"], ["agujas", "dials"], ["correa", "straps"],
  ])("classifies explicit title part in %s", (title, category) => {
    expect(detectWatchPartCategory(title)).toBe(category);
  });

  it("shows source errors instead of returning fabricated products", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("unavailable"); }));
    const result = await searchLiveWatchPartsCloud("Rolex crystal");
    expect(result.items).toEqual([]);
    expect(result.sources.map((s) => s.status)).toEqual(["error", "error", "error", "error"]);
  });

  it("bounds source timeouts to 8 seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const pending = searchLiveWatchPartsCloud("Rolex crystal");
    await vi.advanceTimersByTimeAsync(8000);
    expect((await pending).sources.map((s) => s.status)).toEqual(["timeout", "timeout", "timeout", "timeout"]);
  });

  it("keeps empty API results empty and never fetches browser proxies", async () => {
    const fetchMock = vi.fn(async () => Response.json({ items: [], sources: [{ name: "eBay", status: "ok", count: 0 }] }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await fetchLivePartsFromApi("Rolex crystal")).items).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/search?q=Rolex%20crystal");
    expect(SEARCH_SERVER_TIMEOUT_MS).toBe(8000);
    expect(SEARCH_CLIENT_TIMEOUT_MS).toBeGreaterThan(SEARCH_SERVER_TIMEOUT_MS);
  });

  it("does not retain OEM labels for mismatched generic catalog images", () => {
    for (const id of ["1", "7", "9", "13", "17", "22"]) {
      const part = PARTS.find((item) => item.id === id);
      expect(part?.origin).toBe("generic");
      expect(part?.condition).toBe("Sin verificar");
    }
  });
});