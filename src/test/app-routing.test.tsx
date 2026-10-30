import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { CHOLLOS_TTL_MS, DAILY_CHOLLOS } from "@/lib/chollos";
import {
  buildAliExpressCompatibleQuery,
  isShopifyProductRelevant,
  translateHorologicalQuery,
} from "@/lib/live-watch-engine";
import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches dedicated Cronora pages (/chollos, /marketplace, /blog)", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    for (const path of ["/chollos", "/marketplace", "/blog"]) {
      const matches = router.matchRoutes(path);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    }
  });

  it("translates Spanish horological terms and filters false Shopify brand matches", () => {
    expect(translateHorologicalQuery("Rolex Submariner bisel zafiro")).toBe(
      "Rolex Submariner bezel sapphire crystal",
    );
    expect(
      isShopifyProductRelevant("Rolex Submariner bezel", "Seiko SKX007 Bezel Insert"),
    ).toBe(false);
    expect(
      isShopifyProductRelevant("Seiko SKX007 bisel", "Seiko SKX007 Ceramic Bezel Insert"),
    ).toBe(true);
    expect(buildAliExpressCompatibleQuery("Rolex Datejust correa", "straps")).toContain(
      "904l oyster jubilee",
    );
  });

  it("verifies 24h chollos TTL and 100% canonical eBay item links", () => {
    expect(CHOLLOS_TTL_MS).toBe(24 * 60 * 60 * 1000);
    expect(DAILY_CHOLLOS.length).toBeGreaterThanOrEqual(10);
    for (const deal of DAILY_CHOLLOS) {
      expect(deal.url).toMatch(/^https:\/\/www\.ebay\.es\/itm\/[1234]\d{11}$/);
      expect(deal.image).toMatch(/^https:\/\/www\.picclickimg\.com\//);
      expect(deal.savingsPct).toBeGreaterThanOrEqual(15);
      expect(deal.savingsPct).toBeLessThanOrEqual(65);
    }
  });
});
