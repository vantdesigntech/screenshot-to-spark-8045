import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { validateDecision, validateListingInput, type ListingInput } from "@/lib/listings";

const ok: ListingInput = {
  brand: "Seiko", model: "SKX007", reference: "", priceEur: 250, condition: "good", movementType: "automatic",
  description: "", location: "Madrid", serial: "123456", declaration: true, photo: { type: "image/jpeg", size: 1000 },
};

describe("publicar anuncio", () => {
  it("acepta un anuncio con foto, precio y número de serie", () => expect(validateListingInput(ok)).toBeNull());
  it("exige foto", () => expect(validateListingInput({ ...ok, photo: null })).toMatch(/foto/));
  it("exige precio mayor que 0", () => expect(validateListingInput({ ...ok, priceEur: 0 })).toMatch(/precio/));
  it("exige número de serie", () => expect(validateListingInput({ ...ok, serial: "" })).toMatch(/serie/));
});

describe("moderación", () => {
  it("rechazar exige mensaje para el vendedor", () => expect(validateDecision("reject", "")).not.toBeNull());
  it("aprobar no exige mensaje", () => expect(validateDecision("approve", "")).toBeNull());
});
