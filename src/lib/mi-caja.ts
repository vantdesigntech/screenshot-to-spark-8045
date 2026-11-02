import { supabase } from "@/integrations/supabase/client";

export interface SavedPart { id: string; part_id: string; part_title: string; price_eur: number; store: string }
export interface ShoppingItem { id: string; list_id: string; part_id: string; part_title: string; price_eur: number; store: string; quantity: number; bought: boolean }
export interface ShoppingList { id: string; name: string; created_at: string; items: ShoppingItem[] }

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** Total of a list in EUR, counting quantity; bought items included. */
export function listTotalEur(items: Pick<ShoppingItem, "price_eur" | "quantity">[]) {
  return Math.round(items.reduce((s, i) => s + Number(i.price_eur) * i.quantity, 0) * 100) / 100;
}

export async function getSavedParts(): Promise<SavedPart[]> {
  return check(await supabase.from("watchbox_favorites").select("id, part_id, part_title, price_eur, store").order("created_at", { ascending: false })) as SavedPart[];
}

export async function saveFavorite(userId: string, p: { id: string; title: string; priceEur: number; store: string }) {
  check(await supabase.from("watchbox_favorites").upsert({ user_id: userId, part_id: p.id, part_title: p.title, price_eur: p.priceEur, store: p.store }, { onConflict: "user_id,part_id" }));
}

export async function removeFavorite(partId: string) {
  check(await supabase.from("watchbox_favorites").delete().eq("part_id", partId));
}

export async function getLists(): Promise<ShoppingList[]> {
  const rows = check(await supabase.from("shopping_lists").select("id, name, created_at, items:shopping_list_items(*)").order("created_at", { ascending: true }));
  return (rows ?? []) as unknown as ShoppingList[];
}

export async function createList(name: string) {
  check(await supabase.from("shopping_lists").insert({ name: name.trim().slice(0, 80) }));
}
export async function deleteList(id: string) {
  check(await supabase.from("shopping_lists").delete().eq("id", id));
}
export async function addToList(listId: string, p: SavedPart) {
  check(await supabase.from("shopping_list_items").upsert({ list_id: listId, part_id: p.part_id, part_title: p.part_title, price_eur: p.price_eur, store: p.store }, { onConflict: "list_id,part_id", ignoreDuplicates: true }));
}
export async function updateItem(id: string, patch: { quantity?: number; bought?: boolean }) {
  check(await supabase.from("shopping_list_items").update(patch).eq("id", id));
}
export async function removeItem(id: string) {
  check(await supabase.from("shopping_list_items").delete().eq("id", id));
}
