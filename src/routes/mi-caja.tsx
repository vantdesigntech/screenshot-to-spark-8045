import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ListPlus, Minus, Plus, Trash2 } from "lucide-react";
import { AurikNavbar } from "@/components/AurikNavbar";
import { useAccount } from "@/components/AccountProvider";
import {
  addToList, createList, deleteList, getLists, getSavedParts, listTotalEur, removeFavorite, removeItem, updateItem,
  type SavedPart, type ShoppingList,
} from "@/lib/mi-caja";

export const Route = createFileRoute("/mi-caja")({
  head: () => ({
    meta: [
      { title: "Mi Caja: recambios favoritos y listas | ChronoParts" },
      { name: "description", content: "Tus recambios de reloj guardados y tus listas de compra, sincronizados en tu cuenta ChronoParts." },
      { property: "og:title", content: "Mi Caja | ChronoParts" },
      { property: "og:description", content: "Recambios favoritos y listas de compra de tu cuenta ChronoParts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MiCajaPage,
});

function MiCajaPage() {
  const { user, ready, openAuth } = useAccount();
  const [saved, setSaved] = useState<SavedPart[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, l] = await Promise.all([getSavedParts(), getLists()]);
      setSaved(s);
      setLists(l);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar Mi Caja.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) void load(); }, [user, load]);

  const run = async (fn: () => Promise<void>) => {
    try { await fn(); await load(); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el cambio."); }
  };

  const submitList = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    void run(async () => { await createList(newName); setNewName(""); });
  };

  const btn = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-sm";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AurikNavbar savedCount={saved.length} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight">Mi Caja</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recambios favoritos y listas de compra.</p>

        {!ready ? null : !user ? (
          <div className="mt-8 rounded-md border border-border p-6 text-center">
            <p className="text-sm">Entra en tu cuenta para guardar recambios y crear listas de compra.</p>
            <button type="button" onClick={openAuth} className="mt-4 min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Entrar o registrarse</button>
          </div>
        ) : loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Cargando Mi Caja…</p>
        ) : (
          <>
            {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
            <section aria-labelledby="fav-h" className="mt-8">
              <h2 id="fav-h" className="text-xl font-semibold">Favoritos ({saved.length})</h2>
              {saved.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Aún no has guardado recambios. <Link to="/" className="underline">Busca una pieza</Link> y pulsa guardar.</p>
              ) : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {saved.map((p) => (
                    <li key={p.id} className="rounded-md border border-border p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{p.store}</p>
                      <p className="mt-1 font-semibold">{p.part_title}</p>
                      <p className="mt-1 text-sm">{Number(p.price_eur).toFixed(2)} €</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {lists.length > 0 && (
                          <select aria-label={`Añadir ${p.part_title} a una lista`} defaultValue="" className="min-h-11 rounded-md border border-border bg-background px-2 text-sm"
                            onChange={(e) => { const id = e.target.value; e.target.value = ""; if (id) void run(() => addToList(id, p)); }}>
                            <option value="" disabled>Añadir a lista…</option>
                            {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                          </select>
                        )}
                        <button type="button" className={btn} onClick={() => void run(() => removeFavorite(p.part_id))}><Trash2 className="h-4 w-4" />Quitar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="lists-h" className="mt-10">
              <h2 id="lists-h" className="text-xl font-semibold">Listas de compra</h2>
              <form onSubmit={submitList} className="mt-3 flex gap-2">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} placeholder="Ej.: Restauración SKX007" aria-label="Nombre de la nueva lista"
                  className="min-h-11 flex-1 rounded-md border border-border bg-background px-3 text-base" />
                <button type="submit" className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"><ListPlus className="h-4 w-4" />Crear</button>
              </form>
              {lists.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Crea una lista y añade tus favoritos a ella.</p>}
              <div className="mt-4 space-y-4">
                {lists.map((l) => (
                  <article key={l.id} className="rounded-md border border-border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{l.name}</h3>
                      <button type="button" aria-label={`Borrar lista ${l.name}`} className={btn} onClick={() => void run(() => deleteList(l.id))}><Trash2 className="h-4 w-4" /></button>
                    </div>
                    {l.items.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">Lista vacía. Añade piezas desde Favoritos.</p>
                    ) : (
                      <ul className="mt-3 divide-y divide-border">
                        {l.items.map((i) => (
                          <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                            <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-sm">
                              <input type="checkbox" checked={i.bought} className="h-5 w-5" onChange={(e) => void run(() => updateItem(i.id, { bought: e.target.checked }))} />
                              <span className={i.bought ? "line-through text-muted-foreground" : ""}>{i.part_title}</span>
                            </label>
                            <div className="flex items-center gap-1">
                              <button type="button" aria-label="Menos" className={btn} disabled={i.quantity <= 1} onClick={() => void run(() => updateItem(i.id, { quantity: i.quantity - 1 }))}><Minus className="h-4 w-4" /></button>
                              <span className="w-6 text-center text-sm">{i.quantity}</span>
                              <button type="button" aria-label="Más" className={btn} disabled={i.quantity >= 99} onClick={() => void run(() => updateItem(i.id, { quantity: i.quantity + 1 }))}><Plus className="h-4 w-4" /></button>
                            </div>
                            <span className="w-20 text-right text-sm">{(Number(i.price_eur) * i.quantity).toFixed(2)} €</span>
                            <button type="button" aria-label={`Quitar ${i.part_title}`} className={btn} onClick={() => void run(() => removeItem(i.id))}><Trash2 className="h-4 w-4" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-right text-sm font-semibold">Total: {listTotalEur(l.items).toFixed(2)} €</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
