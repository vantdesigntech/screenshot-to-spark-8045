/**
 * Supabase Cloud Integration for ChronoParts
 * Automatically connects to Supabase REST & Edge Functions when VITE_SUPABASE_URL
 * and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) are present.
 */

const SUPABASE_URL =
  import.meta.env['VITE_SUPABASE_URL'] ||
  "https://bnspjqlbisinmoohgrxo.supabase.co";
const SUPABASE_KEY =
  import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
  import.meta.env['VITE_SUPABASE_ANON_KEY'] ||
  "sb_publishable_iIoYiJ-oNqK4rFF5cgIV5Q_1mSxN794";

function getSupabaseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (!SUPABASE_KEY.startsWith("sb_publishable_")) {
    headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
  }
  return headers;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export async function syncFavoriteToSupabase(part: {
  id: string;
  title: string;
  priceEur: number;
  store: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/watchbox_favorites`, {
      method: "POST",
      headers: getSupabaseHeaders(),
      body: JSON.stringify({
        part_id: part.id,
        part_title: part.title,
        price_eur: part.priceEur,
        store: part.store,
      }),
    });
  } catch {
    // Fallback silently to localStorage if offline
  }
}

export async function syncPriceAlertToSupabase(alert: {
  partId: string;
  title: string;
  targetEur: number;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/price_alerts`, {
      method: "POST",
      headers: getSupabaseHeaders(),
      body: JSON.stringify({
        part_id: alert.partId,
        title: alert.title,
        target_eur: alert.targetEur,
        whatsapp_enabled: true,
      }),
    });
  } catch {
    // Fallback silently if offline
  }
}
