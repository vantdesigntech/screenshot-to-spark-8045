import { supabase } from "@/integrations/supabase/client";

export const LISTING_PHOTO_BUCKET = "listing-photos";
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Public columns only — the private serial is never selected. */
const PUBLIC_COLS =
  "id, owner_id, owner_display_name, brand, model, reference, price_eur, condition, description, approx_location, serial_number_masked, status, review_status, published_at, created_at";

export interface ListingInput {
  brand: string;
  model: string;
  reference: string;
  priceEur: number;
  condition: string;
  movementType: string;
  description: string;
  location: string;
  serial: string;
  declaration: boolean;
  photo: { type: string; size: number } | null;
}

export interface PublicListing {
  id: string;
  owner_id: string;
  owner_display_name: string;
  brand: string;
  model: string;
  reference: string | null;
  price_eur: number;
  condition: string;
  description: string;
  approx_location: string;
  serial_number_masked: string | null;
  status: string;
  review_status: string;
  published_at: string | null;
  created_at: string;
  photoUrl: string | null;
}

export interface Notice { id: string; kind: string; message: string | null; created_at: string; listing_id: string | null }

/** Returns the first problem with the form, or null when it can be published. */
export function validateListingInput(i: ListingInput): string | null {
  if (i.brand.trim().length < 2) return "Indica la marca.";
  if (i.model.trim().length < 1) return "Indica el modelo.";
  if (!Number.isFinite(i.priceEur) || i.priceEur <= 0 || i.priceEur > 2_000_000) return "El precio debe estar entre 0 y 2.000.000 €.";
  if (i.serial.trim().length < 4) return "Escribe el número de serie (mínimo 4 caracteres).";
  if (i.location.trim().length < 2) return "Indica la ciudad o zona aproximada.";
  if (!i.photo) return "Añade una foto.";
  if (!PHOTO_TYPES.includes(i.photo.type)) return "La foto debe ser JPG, PNG o WEBP.";
  if (i.photo.size > MAX_PHOTO_BYTES) return "La foto no puede pasar de 8 MB.";
  if (!i.declaration) return "Debes declarar que el reloj es auténtico.";
  return null;
}

/** A rejection must explain the reason to the seller; approval message is optional. */
export function validateDecision(decision: "approve" | "reject", message: string): string | null {
  if (decision === "reject" && message.trim().length < 5) return "Escribe el motivo del rechazo para el vendedor.";
  return null;
}

function fail(e: { message: string } | null) {
  if (e) throw new Error(e.message);
}

export async function publishListing(ownerId: string, ownerName: string, i: ListingInput, file: File) {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: ownerId,
      owner_display_name: ownerName || "Vendedor",
      brand: i.brand.trim(),
      model: i.model.trim(),
      reference: i.reference.trim() || null,
      price_eur: i.priceEur,
      condition: i.condition,
      movement_type: i.movementType,
      description: i.description.trim(),
      approx_location: i.location.trim(),
      serial_number_private: i.serial.trim(),
      authenticity_declaration: i.declaration,
      listing_type: "watch",
      status: "draft",
    })
    .select("id")
    .single();
  fail(error);
  const id = data!.id;
  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  fail((await supabase.storage.from(LISTING_PHOTO_BUCKET).upload(path, file, { contentType: file.type })).error);
  fail(
    (await supabase.from("listing_images").insert({
      listing_id: id, storage_path: path, slot_type: "dial", sort_order: 0, mime_type: file.type, file_size_bytes: file.size,
    })).error,
  );
  fail((await supabase.from("listings").update({ status: "published" }).eq("id", id)).error);
  return id;
}

async function withPhotos(rows: Omit<PublicListing, "photoUrl">[]): Promise<PublicListing[]> {
  if (!rows.length) return [];
  const { data: imgs } = await supabase
    .from("listing_images").select("listing_id, storage_path, sort_order").in("listing_id", rows.map((r) => r.id)).order("sort_order");
  const first = new Map<string, string>();
  for (const im of imgs ?? []) if (!first.has(im.listing_id)) first.set(im.listing_id, im.storage_path);
  const paths = [...first.values()];
  const signed = paths.length ? (await supabase.storage.from(LISTING_PHOTO_BUCKET).createSignedUrls(paths, 3600)).data ?? [] : [];
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));
  return rows.map((r) => ({ ...r, photoUrl: urlByPath.get(first.get(r.id) ?? "") ?? null }));
}

export async function getCommunityListings(): Promise<PublicListing[]> {
  const { data, error } = await supabase
    .from("listings").select(PUBLIC_COLS).eq("listing_type", "watch").eq("is_demo", false)
    .in("status", ["published", "sold"]).neq("review_status", "rejected")
    .order("published_at", { ascending: false }).limit(24);
  fail(error);
  return withPhotos((data ?? []) as Omit<PublicListing, "photoUrl">[]);
}

export async function getModerationQueue(): Promise<PublicListing[]> {
  const { data, error } = await supabase
    .from("listings").select(PUBLIC_COLS).eq("status", "published").in("review_status", ["pending", "manual_review"])
    .order("published_at", { ascending: true }).limit(50);
  fail(error);
  return withPhotos((data ?? []) as Omit<PublicListing, "photoUrl">[]);
}

export async function isModerator(userId: string) {
  const { data } = await supabase.from("marketplace_moderators").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}

/** Full serial — only returned to the seller or a moderator (checked in the database). */
export async function getListingSerial(listingId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_listing_serial", { p_listing_id: listingId });
  fail(error);
  return (data as string | null) ?? null;
}

export async function moderateListing(listingId: string, decision: "approve" | "reject", message: string) {
  const err = validateDecision(decision, message);
  if (err) throw new Error(err);
  fail((await supabase.rpc("moderate_listing", { p_listing_id: listingId, p_decision: decision, p_message: message })).error);
}

export async function getMyNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notifications").select("id, kind, message, created_at, listing_id")
    .in("kind", ["listing_approved", "listing_rejected"]).order("created_at", { ascending: false }).limit(20);
  fail(error);
  return (data ?? []) as Notice[];
}
