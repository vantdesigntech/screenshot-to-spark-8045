import { afterEach, describe, expect, it, vi } from "vitest";
import { detectListingBrand, detectWatchPartCategory, isShopifyProductRelevant, parseEbayListings, parseListingPrice, searchLiveWatchPartsCloud, SEARCH_SERVER_TIMEOUT_MS } from "@/lib/live-watch-engine";
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

  it("matches Spanish part searches against English catalog titles and specifications", () => {
    const results = filterParts(PARTS, { query: "Cristal Zafiro", origin: "all", categories: [], maxPrice: 1500 });
    expect(results.some((part) => /sapphire crystal/i.test(part.title))).toBe(true);
  });

  it("rejects live listings that match only part of a multiword query", () => {
    expect(isShopifyProductRelevant("Rolex Submariner bezel", "Rolex Datejust dial")).toBe(false);
    expect(isShopifyProductRelevant("Rolex Submariner bezel", "Rolex Submariner ceramic bezel")).toBe(true);
    const html = listing("Rolex Datejust dial", "€73.21");
    expect(parseEbayListings(html, "Rolex Submariner bezel")).toEqual([]);
  });

  it("excludes jewelry and complete watches from parts searches", () => {
    expect(isShopifyProductRelevant(
      "Cristal Zafiro",
      "Earrings By Mariana Woman Caribbean Blue Opal and Sapphire Swarovski Crystals",
    )).toBe(false);
    expect(isShopifyProductRelevant(
      "Cristal Zafiro",
      "Shearwater Teric Dive Computer Watch Black AMOLED Sapphire Crystal 200M",
    )).toBe(false);
    expect(isShopifyProductRelevant(
      "Cristal Zafiro",
      "Replacement sapphire crystal 31.5mm, double AR coated + gasket",
    )).toBe(true);
    expect(isShopifyProductRelevant(
      "Rolex crystal",
      "Sapphire crystal for Rolex watch",
    )).toBe(true);
  });

  it("filters irrelevant items returned by the external search engine", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/api/parts")) {
        return Response.json({
          items: [{ title: "Rolex Datejust dial", store: "eBay" }],
          sources: [{ name: "eBay", status: "ok", count: 1 }],
        });
      }
      return new Response(url.includes("suggest.json")
        ? '{"resources":{"results":{"products":[]}}}'
        : "<html></html>");
    }));
    const result = await searchLiveWatchPartsCloud("Rolex Submariner bezel");
    expect(result.items).toEqual([]);
    expect(result.sources).toHaveLength(4);
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
    const [part] = parseEbayListings(listing("Rolex 124300 sapphire crystal", "€73.21"), "Rolex 124300 crystal");
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
    // A fetch that only settles when its abort signal fires, like a hung source.
    vi.stubGlobal("fetch", vi.fn((_url: string, init?: { signal?: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Source timeout", "AbortError")), { once: true });
      }),
    ));
    const pending = searchLiveWatchPartsCloud("Rolex crystal");
    // The engine probe gives up at 4.5s, then each fallback source gets its own
    // 8s deadline, so the fake clock has to pass both before anything resolves.
    await vi.advanceTimersByTimeAsync(4500);
    await vi.advanceTimersByTimeAsync(SEARCH_SERVER_TIMEOUT_MS);
    expect((await pending).sources.map((s) => s.status)).toEqual(["timeout", "timeout", "timeout", "timeout"]);
  });

  it("keeps the engine timeout active while reading the response body", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", undefined);
    let firstSignal: AbortSignal | undefined;
    let calls = 0;
    const stalledResponse = new Response();
    vi.spyOn(stalledResponse, "json").mockImplementation(() => new Promise((_resolve, reject) => {
      firstSignal?.addEventListener("abort", () =>
        reject(new DOMException("Source timeout", "AbortError")), { once: true });
    }));
    vi.stubGlobal("fetch", vi.fn((url: string, init?: RequestInit) => {
      calls += 1;
      if (calls === 1) {
        firstSignal = init?.signal ?? undefined;
        return Promise.resolve(stalledResponse);
      }
      return Promise.resolve(url.includes("suggest.json")
        ? Response.json({ resources: { results: { products: [] } } })
        : new Response("<html></html>"));
    }));
    const pending = searchLiveWatchPartsCloud("Rolex crystal");
    await vi.advanceTimersByTimeAsync(4500);
    expect(firstSignal?.aborted).toBe(true);
    const result = await pending;
    expect(result.sources).toHaveLength(4);
    expect(result.sources.every((source) => source.status === "ok")).toBe(true);
  });

  it("keeps empty API results empty and never fetches browser proxies", async () => {
    const fetchMock = vi.fn(async () => Response.json({ items: [], sources: [{ name: "eBay", status: "ok", count: 0 }] }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await fetchLivePartsFromApi("Rolex crystal")).items).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls as unknown[][])[0]?.[0]).toBe("/api/search?q=Rolex%20crystal");
    expect(SEARCH_SERVER_TIMEOUT_MS).toBe(8000);
    expect(SEARCH_CLIENT_TIMEOUT_MS).toBeGreaterThan(4500 + SEARCH_SERVER_TIMEOUT_MS);
  });

  it("does not retain OEM labels for mismatched generic catalog images", () => {
    for (const id of ["1", "7", "9", "13", "17", "22"]) {
      const part = PARTS.find((item) => item.id === id);
      expect(part?.origin).toBe("generic");
      expect(part?.condition).toBe("Sin verificar");
    }
  });
});