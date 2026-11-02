import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AurikNavbar } from "@/components/AurikNavbar";
import { displayNameOf, useAccount } from "@/components/AccountProvider";
import { getMyNotices, publishListing, validateListingInput, type Notice } from "@/lib/listings";

export const Route = createFileRoute("/publicar")({
  head: () => ({
    meta: [
      { title: "Publicar anuncio de reloj | ChronoParts Marketplace" },
      { name: "description", content: "Publica tu reloj en el Marketplace de ChronoParts con foto, precio y número de serie privado." },
      { property: "og:title", content: "Publicar anuncio | ChronoParts" },
      { property: "og:description", content: "Vende tu reloj con foto y precio; el número de serie solo lo ven tú y los moderadores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicarPage,
});

const input = "min-h-11 w-full rounded-md border border-border bg-background px-3 text-base";

function PublicarPage() {
  const { user, ready, openAuth } = useAccount();
  const [f, setF] = useState({ brand: "", model: "", reference: "", price: "", condition: "good", movementType: "automatic", description: "", location: "", serial: "" });
  const [declaration, setDeclaration] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => { if (user) getMyNotices().then(setNotices).catch(() => setNotices([])); }, [user, doneId]);
  useEffect(() => { if (!file) { setPreview(null); return; } const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u); }, [file]);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return openAuth();
    const data = { ...f, priceEur: Number(f.price.replace(",", ".")), declaration, photo: file ? { type: file.type, size: file.size } : null };
    const problem = validateListingInput(data);
    if (problem) return setError(problem);
    setBusy(true); setError("");
    try {
      setDoneId(await publishListing(user.id, displayNameOf(user), data, file!));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar el anuncio.");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AurikNavbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight">Publicar anuncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu reloj aparecerá en el Marketplace. Un moderador lo revisará y te enviará un aviso.</p>

        {!ready ? null : !user ? (
          <div className="mt-8 rounded-md border border-border p-6 text-center">
            <p className="text-sm">Entra en tu cuenta para publicar un anuncio.</p>
            <button type="button" onClick={openAuth} className="mt-4 min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Entrar o registrarse</button>
          </div>
        ) : doneId ? (
          <div className="mt-8 rounded-md border border-border p-6">
            <p className="font-semibold">Anuncio publicado.</p>
            <p className="mt-1 text-sm text-muted-foreground">Está en el Marketplace como "pendiente de revisión". El número de serie completo no se muestra a los compradores.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/marketplace" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Ver Marketplace</Link>
              <button type="button" onClick={() => { setDoneId(null); setFile(null); setDeclaration(false); setF((s) => ({ ...s, serial: "", price: "", model: "", reference: "", description: "" })); }} className="min-h-11 rounded-md border border-border px-4 text-sm">Publicar otro</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 grid gap-4" noValidate>
            <label className="grid gap-1 text-sm">Foto del reloj
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
            </label>
            {preview && <img src={preview} alt="Vista previa de la foto" className="aspect-square w-40 rounded-md object-cover" />}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">Marca<input className={input} value={f.brand} onChange={set("brand")} maxLength={60} /></label>
              <label className="grid gap-1 text-sm">Modelo<input className={input} value={f.model} onChange={set("model")} maxLength={80} /></label>
              <label className="grid gap-1 text-sm">Referencia (opcional)<input className={input} value={f.reference} onChange={set("reference")} maxLength={40} /></label>
              <label className="grid gap-1 text-sm">Precio (€)<input className={input} inputMode="decimal" value={f.price} onChange={set("price")} /></label>
              <label className="grid gap-1 text-sm">Estado
                <select className={input} value={f.condition} onChange={set("condition")}>
                  <option value="new">Nuevo</option><option value="nos">NOS</option><option value="excellent">Excelente</option>
                  <option value="good">Bueno</option><option value="fair">Aceptable</option><option value="for_parts">Para piezas</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">Movimiento
                <select className={input} value={f.movementType} onChange={set("movementType")}>
                  <option value="automatic">Automático</option><option value="manual">Manual</option><option value="quartz">Cuarzo</option><option value="other">Otro</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">Ubicación aproximada<input className={input} value={f.location} onChange={set("location")} maxLength={60} placeholder="Ej.: Madrid" /></label>
              <label className="grid gap-1 text-sm">Número de serie<input className={input} value={f.serial} onChange={set("serial")} maxLength={40} autoComplete="off" />
                <span className="text-xs text-muted-foreground">Solo lo verán tú y los moderadores. Los compradores ven una versión oculta (ej. 12••••89).</span>
              </label>
            </div>
            <label className="grid gap-1 text-sm">Descripción<textarea className={`${input} min-h-28 py-2`} value={f.description} onChange={set("description")} maxLength={2000} /></label>
            <label className="flex min-h-11 items-start gap-2 text-sm">
              <input type="checkbox" checked={declaration} onChange={(e) => setDeclaration(e.target.checked)} className="mt-1 h-5 w-5" />
              Declaro que el reloj es auténtico y he indicado cualquier modificación.
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={busy} className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Publicando…" : "Publicar en Marketplace"}</button>
          </form>
        )}

        {user && notices.length > 0 && (
          <section aria-labelledby="avisos-h" className="mt-10">
            <h2 id="avisos-h" className="text-xl font-semibold">Avisos de moderación</h2>
            <ul className="mt-3 space-y-2">
              {notices.map((n) => (
                <li key={n.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-semibold">{n.kind === "listing_approved" ? "Anuncio aprobado" : "Anuncio rechazado"}</p>
                  {n.message && <p className="mt-1 text-muted-foreground">{n.message}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("es-ES")}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
