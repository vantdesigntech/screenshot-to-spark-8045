import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { interpretByKeywords, type InterpretedFilters } from "./interpret-search";

const CATS = ["straps", "bezels", "crystals", "dials", "movements", "crowns"] as const;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["category", "brand", "model", "calibre", "lugWidthMm", "material", "maxPrice", "origin"],
  properties: {
    category: { type: ["string", "null"], enum: [...CATS, null] },
    brand: { type: ["string", "null"] },
    model: { type: ["string", "null"] },
    calibre: { type: ["string", "null"] },
    lugWidthMm: { type: ["number", "null"] },
    material: { type: ["string", "null"] },
    maxPrice: { type: ["number", "null"] },
    origin: { type: ["string", "null"], enum: ["OEM", "Generic", null] },
  },
};

export type InterpretResult = {
  filters: InterpretedFilters;
  mode: "ai" | "keywords";
  notice?: string;
};

export const interpretSearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ phrase: z.string().trim().min(1).max(300) }).parse(d))
  .handler(async ({ data }): Promise<InterpretResult> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) {
      return { filters: interpretByKeywords(data.phrase), mode: "keywords", notice: "IA no disponible: búsqueda por palabras clave." };
    }
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "Convert a watch-parts search phrase (any language) into filters. Only extract what the user said; use null for anything not stated. Never invent parts, prices or compatibility. Categories: straps (straps, bracelets), bezels, crystals (glass, sapphire), dials (dials, hands), movements (calibres), crowns (crowns, stems). origin: OEM = original/genuine, Generic = aftermarket/compatible. maxPrice in EUR.",
        input: data.phrase,
        text: { format: { type: "json_schema", name: "filters", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const msg =
        res.status === 402 ? "Sin créditos de IA: búsqueda por palabras clave."
        : res.status === 429 ? "IA saturada ahora mismo: búsqueda por palabras clave."
        : "IA no disponible: búsqueda por palabras clave.";
      return { filters: interpretByKeywords(data.phrase), mode: "keywords", notice: msg };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        } catch {
          /* ignore partial */
        }
      }
    }
    try {
      return { filters: JSON.parse(text) as InterpretedFilters, mode: "ai" };
    } catch {
      return { filters: interpretByKeywords(data.phrase), mode: "keywords", notice: "No se pudo interpretar con IA: búsqueda por palabras clave." };
    }
  });
