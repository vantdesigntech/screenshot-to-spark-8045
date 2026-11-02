import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCommunityListings, type PublicListing } from "@/lib/listings";

export function CommunityListings() {
  const [items, setItems] = useState<PublicListing[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getCommunityListings().then(setItems).catch((e) => { setItems([]); setError(e instanceof Error ? e.message : "Error"); }); }, []);

  return (
    <section aria-labelledby="community-h" className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="community-h" className="text-lg font-bold">Anuncios de la comunidad</h2>
        <Link to="/publicar" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Publicar anuncio</Link>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">No se pudieron cargar los anuncios: {error}</p>}
      {items === null ? <p className="mt-3 text-sm text-muted-foreground">Cargando…</p> : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Todavía no hay anuncios publicados.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((l) => (
            <li key={l.id} className="rounded-md border border-border p-2">
              {l.photoUrl ? <img src={l.photoUrl} alt={`${l.brand} ${l.model}`} loading="lazy" className="aspect-square w-full rounded object-cover" /> : <div className="aspect-square rounded bg-muted" />}
              <p className="mt-2 text-sm font-semibold">{l.brand} {l.model}</p>
              <p className="text-sm">{Number(l.price_eur).toLocaleString("es-ES")} €</p>
              <p className="text-xs text-muted-foreground">Serie: {l.serial_number_masked ?? "—"} · {l.review_status === "passed_photo_review" ? "Revisado" : "Pendiente de revisión"}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
