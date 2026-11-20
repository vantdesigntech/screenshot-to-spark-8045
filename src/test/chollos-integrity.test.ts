import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLiveChollosFromApi } from "@/lib/chollos";
import { computeAiCholloMetricsCloud, searchLiveChollosCloud } from "@/lib/live-watch-engine";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function listing(title: string, price: string, id = "123456789012"): string {
  return `<li id="item-${id}"><h3>${title}</h3><img data-src="https://example.com/${id}.jpg" alt="${title}"><span class="price">${price}</span></li>`;
}

describe("Chollos integrity", () => {
  it("does not estimate market value for models without a benchmark", () => {
    expect(computeAiCholloMetricsCloud("Unlisted Swiss automatic watch", 100, "eBay")).toBeNull();
    expect(computeAiCholloMetricsCloud("Seiko automatic watch", 100, "eBay")).toBeNull();
    expect(
      computeAiCholloMetricsCloud("Omega Seamaster Automatic Watch", 350, "eBay")?.marketValueEur,
    ).toBe(950);
  });

  it("only returns a matching, benchmarked live listing", async () => {
    vi.stubGlobal("window", undefined);
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/api/chollos")) {
        return new Response("Unavailable", { status: 503 });
      }
      return new Response(listing("Omega Geneve Automatic Vintage Watch", "€300"));
    });
    vi.stubGlobal("fetch", fetchMock);

    const deals = await searchLiveChollosCloud("Omega Geneve");
    expect(deals).toHaveLength(1);
    expect(deals[0]).toMatchObject({
      title: "Omega Geneve Automatic Vintage Watch",
      priceEur: 300,
      marketValueEur: 690,
      savingsPct: 57,
      url: "https://www.ebay.es/itm/123456789012",
    });
  });

  it("bypasses cached chollos when a fresh scan is requested", async () => {
    vi.stubGlobal("window", undefined);
    let listingScans = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/api/chollos")) {
          return new Response("Unavailable", { status: 503 });
        }
        listingScans += 1;
        return new Response(
          listingScans === 1
            ? listing("Omega Geneve Automatic Vintage Watch", "€300", "223456789012")
            : "<html></html>",
        );
      }),
    );

    expect(await searchLiveChollosCloud("Omega Geneve vintage")).toHaveLength(1);
    expect(await searchLiveChollosCloud("Omega Geneve vintage", true)).toEqual([]);
  });

  it("does not return unrelated listings for a model-specific query", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/api/chollos")) {
          return new Response("Unavailable", { status: 503 });
        }
        return new Response(listing("Omega Geneve Automatic Vintage Watch", "€300"));
      }),
    );

    expect(await searchLiveChollosCloud("Rolex Submariner")).toEqual([]);
  });

  it("matches references written with or without a space", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("/api/chollos")) {
          return new Response("Unavailable", { status: 503 });
        }
        return new Response(listing("Seiko SKX007 Diver Automatic Watch", "€180"));
      }),
    );

    expect(await searchLiveChollosCloud("Seiko SKX 007")).toHaveLength(1);
  });

  it("returns no filler deals when live sources contain no comparable offer", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("localhost:3001")) {
          return Response.json({
            items: [
              {
                id: "fake",
                title: "Rolex Submariner Date",
                brand: "Rolex",
                platform: "eBay",
                dealType: "Rebaja Directa",
                priceEur: 100,
                image: "https://example.com/watch.jpg",
                url: "https://www.ebay.es/itm/123456789012",
              },
            ],
          });
        }
        if (url.includes("/api/chollos")) return Response.json({ items: [] });
        return new Response("<html></html>");
      }),
    );

    expect(await fetchLiveChollosFromApi("Rolex Submariner", true)).toEqual([]);
    expect(await fetchLiveChollosFromApi("", true)).toEqual([]);
  });
});
