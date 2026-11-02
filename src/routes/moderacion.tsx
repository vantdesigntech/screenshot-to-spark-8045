import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AurikNavbar } from "@/components/AurikNavbar";
import { useAccount } from "@/components/AccountProvider";
import { getListingSerial, getModerationQueue, isModerator, moderateListing, validateDecision, type PublicListing } from "@/lib/listings";

export const Route = createFileRoute("/moderacion")({
  head: () => ({
    meta: [
      { title: "Moderación de anuncios | ChronoParts" },
      { name: "description", content: "Panel de moderadores para aprobar o rechazar anuncios del Marketplace de ChronoParts." },
      { property: "og:title", content: "Moderación | ChronoParts" },
      { property: "og:description", content: "Revisión de anuncios publicados en el Marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModeracionPage,
});

function ModeracionPage() {
  const { user, ready, openAuth } = useAccount();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [queue, setQueue] = useState<PublicListing[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { setQueue(await getModerationQueue()); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar la cola."); }
  }, []);

  useEffect(() => {
    if (!user) return;
    isModerator(user.id).then((ok) => { setAllowed(ok); if (ok) void load(); });
  }, [user, load]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AurikNavbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
        <h1 className="text-3xl font-bold tracking-tight">Moderación</h1>
        <p className="mt-1 text-sm text-muted-foreground">Aprueba o rechaza los anuncios publicados. El vendedor recibe tu mensaje como aviso.</p>
        {!ready ? null : !user ? (
          <button type="button" onClick={openAuth} className="mt-6 min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground">Entrar</button>
        ) : allowed === null ? (
          <p className="mt-6 text-sm text-muted-foreground">Comprobando permisos…</p>
        ) : !allowed ? (
          <p className="mt-6 rounded-md border border-border p-4 text-sm">Tu cuenta no es de moderador.</p>
        ) : (
          <>
            {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
            {queue.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">No hay anuncios pendientes.</p> : (
              <ul className="mt-6 space-y-4">{queue.map((l) => <ReviewCard key={l.id} listing={l} onDone={load} />)}</ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ReviewCard({ listing: l, onDone }: { listing: PublicListing; onDone: () => Promise<void> }) {
  const [msg, setMsg] = useState("");
  const [serial, setSerial] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const decide = async (d: "approve" | "reject") => {
    const v = validateDecision(d, msg);
    if (v) return setErr(v);
    setBusy(true); setErr("");
    try { await moderateListing(l.id, d, msg); await onDone(); }
    catch (e) { setErr(e instanceof Error ? e.message : "No se pudo guardar la decisión."); }
    finally { setBusy(false); }
  };

  return (
    <li className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-[160px_1fr]">
      {l.photoUrl ? <img src={l.photoUrl} alt={`${l.brand} ${l.model}`} className="aspect-square w-full rounded-md object-cover" /> : <div className="aspect-square rounded-md bg-muted" />}
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{l.owner_display_name} · {l.approx_location}</p>
        <h2 className="mt-1 text-lg font-semibold">{l.brand} {l.model} {l.reference ?? ""}</h2>
        <p className="mt-1 text-sm">{Number(l.price_eur).toLocaleString("es-ES")} € · {l.review_status === "pending" ? "Pendiente" : "Revisión manual"}</p>
        {l.description && <p className="mt-2 text-sm text-muted-foreground">{l.description}</p>}
        <p className="mt-2 text-sm">Número de serie: {serial ?? l.serial_number_masked ?? "—"}{" "}
          {!serial && <button type="button" className="underline" onClick={() => getListingSerial(l.id).then(setSerial).catch(() => setErr("No se pudo leer el número de serie."))}>Ver completo</button>}
        </p>
        <label className="mt-3 grid gap-1 text-sm">Mensaje para el vendedor
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1000} className="min-h-20 rounded-md border border-border bg-background px-3 py-2 text-base" placeholder="Obligatorio si rechazas" />
        </label>
        {err && <p role="alert" className="mt-2 text-sm text-destructive">{err}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void decide("approve")} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">Aprobar</button>
          <button type="button" disabled={busy} onClick={() => void decide("reject")} className="min-h-11 rounded-md border border-destructive px-4 text-sm text-destructive disabled:opacity-60">Rechazar</button>
        </div>
      </div>
    </li>
  );
}
