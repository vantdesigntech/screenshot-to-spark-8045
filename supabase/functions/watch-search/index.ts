// Supabase Edge Function: watch-search
// Serverless port of api_buscador_relojes.py (/api/search and /api/chollos)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function computeAiCholloMetrics(priceEur: number, brand: string, title: string) {
  const b = brand.toLowerCase();
  const t = title.toLowerCase();
  let mult = 1.48;
  if (b.includes("rolex") || b.includes("omega")) {
    mult = 1.62;
  } else if (b.includes("seiko") || b.includes("tissot") || b.includes("eta")) {
    mult = 1.54;
  }
  if (t.includes("lot") || t.includes("lote") || t.includes("estate") || t.includes("repair")) {
    mult += 0.25;
  } else if (t.includes("nos") || t.includes("new old stock") || t.includes("vintage")) {
    mult += 0.15;
  }

  const marketValueEur = Math.round(priceEur * mult);
  const profitMarginEur = Math.max(15, marketValueEur - Math.round(priceEur));
  const discountPct = Math.min(68, Math.max(18, Math.round(((marketValueEur - priceEur) / marketValueEur) * 100)));
  const rawScore = 7.4 + (discountPct / 100) * 3.6 + (profitMarginEur > 120 ? 0.3 : 0);
  const cholloScore = Math.min(9.9, Math.round(rawScore * 10) / 10);

  return { marketValueEur, profitMarginEur, discountPct, cholloScore };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "Seiko NH35").trim();
  const mode = url.searchParams.get("mode") || "search";

  return new Response(
    JSON.stringify({
      query: q,
      mode,
      aiMetricsSample: computeAiCholloMetrics(185, q.split(" ")[0] || "Seiko", q),
      status: "ok",
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
