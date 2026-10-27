import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { TablesUpdate } from "@/integrations/supabase/types";

export const loadAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("account_state").select("*").eq("user_id", context.userId).single();
    if (error) throw new Error(error.message);
    return data;
  });

const stateSchema = z.object({
  favorites: z.array(z.object({ id: z.string(), title: z.string() }).passthrough()).optional(),
  alerts: z.array(z.object({ partId: z.string(), title: z.string(), targetEur: z.number().nonnegative() })).optional(),
  pro_demo: z.boolean().optional(), whatsapp_alerts: z.boolean().optional(),
  searches_used: z.number().int().min(0).max(5).optional(), search_day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type AccountPatch = z.infer<typeof stateSchema>;
export const saveAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => stateSchema.parse(input))
  .handler(async ({ context, data }) => {
    const patch = JSON.parse(JSON.stringify(data)) as TablesUpdate<"account_state">;
    const { error } = await context.supabase.from("account_state").update(patch).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });