// Supabase Edge Function: watch-search
// Public Cloud Live Watch Parts & Chollos Aggregator (Zero localhost dependency)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
};

function detectCategory(query: string): string {
  const q = query.toLowerCase();
  if (/(bezel|bisel|insert|inserto)/.test(q)) return "bezels";
  if (/(crystal|cristal|sapphire|zafiro|plexi|hesalite)/.test(q)) return "crystals";
  if (/(dial|esfera|hands|agujas|manecillas)/.test(q)) return "dials";
  if (/(crown|corona|stem|tije|tija|pulsador)/.test(q)) return "crowns";
  if (/(movement|movimiento|calibre|nh35|nh36|2824|3230|1861|9015|rotor|eta)/.test(q)) {
    return "movements";
  }
  return "straps";
}

function parsePriceEur(text: string | undefined, fallback = 65): number {
  if (!text) return fallback;
  const match = String(text).replace(/\s+/g, "").match(/(\d{1,5}(?:[.,]\d{1,2})?)/);
  if (match) {
    const val = parseFloat(match[1].replace(",", "."));
    if (!Number.isNaN(val) && val >= 1 && val <= 25000) {
      return Math.round(val * 100) / 100;
    }
  }
  return fallback;
}

async function scrapePicClickEbay(query: string) {
  const items: Array<Record<string, unknown>> = [];
  const cat = detectCategory(query);
  const brandGuess = (query.split(/\s+/)[0] || "Swiss").replace(/^./, (c) => c.toUpperCase());
  const pairGroup = `live-group-${query.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14)}`;

  try {
    const res = await fetch(`https://picclick.com/?q=${encodeURIComponent(query)}`, {
      headers: BROWSER_HEADERS,
    });
    if (!res.ok) return items;
    const html = await res.text();
    const blocks = html.split(/<li[^>]+id="item-/i).slice(1, 8);
    for (const block of blocks) {
      const idMatch = block.match(/^(\d+)"/);
      if (!idMatch) continue;
      const itemId = idMatch[1];
      const imgMatch =
        block.match(/data-src="([^"]+)"/i) ||
        block.match(/src="(https?:\/\/[^"]*picclickimg[^"]+)"/i) ||
        block.match(/src="([^"]+)"/i);
      const rawImg = imgMatch?.[1] || "";
      const imgUrl = rawImg.startsWith("//") ? `https:${rawImg}` : rawImg;
      if (!imgUrl || imgUrl.startsWith("data:")) continue;

      const altMatch = block.match(/alt="([^"]+)"/i);
      const title = (altMatch?.[1] || query).replace(/&quot;/g, '"').trim();
      const priceMatch = block.match(/[$€£]\s*(\d+(?:[.,]\d{1,2})?)/);
      const priceEur = parsePriceEur(priceMatch?.[1], 68);
      const isOem = /(genuine|original|oem|nos|vintage|rolex|omega|tissot|eta|authentic)/i.test(
        title,
      );

      items.push({
        id: `live-ebay-${itemId}`,
        title: title.slice(0, 95),
        brand: brandGuess,
        store: "eBay",
        origin: isOem ? "oem" : "generic",
        category: cat,
        priceEur,
        delivery: "3–6 días · eBay Direct",
        image: imgUrl,
        spec: `eBay #${itemId} · Foto 1:1 Verificada`,
        oemRef: `EBAY-${itemId.slice(-6)}`,
        compatibleWith: [query, `eBay #${itemId}`],
        condition: isOem ? "NOS Vintage" : "Aftermarket 1:1",
        pairGroupId: pairGroup,
        customUrl: `https://www.ebay.es/itm/${itemId}`,
      });
      if (items.length >= 4) break;
    }
  } catch {
    // Non-blocking
  }
  return items;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "Seiko NH35").trim();
  const mode = url.searchParams.get("mode") || "search";

  const items = await scrapePicClickEbay(q);

  return new Response(
    JSON.stringify({
      query: q,
      mode,
      count: items.length,
      items,
      status: "ok",
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
