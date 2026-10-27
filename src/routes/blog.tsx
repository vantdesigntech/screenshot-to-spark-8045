import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AccountControls } from "@/components/AccountProvider";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Code2,
  ExternalLink,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  SEO_BLOG_ARTICLES,
  buildBlogJsonLd,
  resolveBlogFallbackImage,
  type BlogArticle,
} from "@/lib/seo-blog";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      {
        title: "Blog de Relojería & Guías Técnicas — ChronoParts",
      },
      {
        name: "description",
        content:
          "Tablas maestras de compatibilidad Seiko NH35 vs ETA 2824, medidas de cristales de zafiro SKX007, referencias OEM Rolex 124300 y correas integradas Tissot PRX.",
      },
      { property: "og:title", content: "Blog de Relojería y Guías Técnicas — ChronoParts" },
      { property: "og:description", content: "Guías de compatibilidad, calibres, cristales y recambios OEM frente a aftermarket." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const [selectedSlug, setSelectedSlug] = useState<string>(SEO_BLOG_ARTICLES[0]?.slug ?? "");
  const [showJsonLd, setShowJsonLd] = useState(false);

  const activeArticle =
    SEO_BLOG_ARTICLES.find((a) => a.slug === selectedSlug) ?? SEO_BLOG_ARTICLES[0];
  const jsonLdObj = buildBlogJsonLd(SEO_BLOG_ARTICLES);

  if (!activeArticle) return <p className="p-6">No hay artículos disponibles.</p>;

  return (
    <div className="min-h-screen bg-background text-foreground chronoparts-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdObj) }}
      />

      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-bold hover:border-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al Buscador 3D
            </Link>
            <div>
              <span className="font-serif text-xl sm:text-2xl">
                Chrono<em>Parts</em> · <span className="text-primary">Blog</span>
              </span>
            </div>
          </div>

          <div className="flex w-full items-center gap-2.5 overflow-x-auto pb-2 sm:w-auto">
            <AccountControls />
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-[11px] font-bold hover:bg-secondary"
            >
              Sitemap.xml ↗
            </a>
            <Button variant="ghost" size="sm"
              onClick={() => setShowJsonLd((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold text-primary-foreground"
            >
              <Code2 className="h-3.5 w-3.5 text-accent" />
              {showJsonLd ? "Ocultar Datos Estructurados" : "Datos Estructurados (Schema.org)"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        {showJsonLd && (
          <div className="mb-8 rounded-2xl border border-primary/20 bg-primary p-5 text-primary-foreground shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
              <span className="text-xs font-black uppercase tracking-widest text-accent">
                Datos Estructurados · google/schema-dts &amp; joshbuchea/HEAD (TechArticle + FAQPage + WebSite)
              </span>
              <span className="text-[11px] opacity-75">Indexación activa en &lt;head&gt;</span>
            </div>
            <pre className="max-h-60 overflow-auto rounded-xl bg-black/40 p-4 text-[11px] text-lime-200">
              {JSON.stringify(jsonLdObj, null, 2)}
            </pre>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Sidebar list of guides */}
          <aside className="space-y-5 lg:col-span-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Artículos del Blog ({SEO_BLOG_ARTICLES.length})
            </p>
            {SEO_BLOG_ARTICLES.map((art, idx) => {
              const active = art.slug === activeArticle.slug;
              return (
                <Button variant="ghost" size="sm"
                  key={art.slug}
                  onClick={() => setSelectedSlug(art.slug)}
                  className={`w-full rounded-2xl border p-5 sm:p-6 text-left transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={art.heroImage}
                      alt={art.title}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fb = resolveBlogFallbackImage(idx);
                        if (!target.src.endsWith(fb)) target.src = fb;
                      }}
                      className="h-14 w-14 shrink-0 rounded-xl border border-border/50 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-75">
                        <span className="truncate">{art.category}</span>
                        <span className="shrink-0">{art.readTime}</span>
                      </div>
                      <h3 className="mt-1 line-clamp-2 font-display text-xs font-black leading-snug sm:text-sm">
                        {art.title}
                      </h3>
                    </div>
                  </div>
                  <p
                    className={`mt-2 text-[11px] font-bold ${
                      active ? "text-accent" : "text-emerald-700"
                    }`}
                  >
                    {art.oemSavingsHighlight}
                  </p>
                </Button>
              );
            })}
          </aside>

          {/* Active article full content */}
          <article className="min-w-0 space-y-6 bg-card p-5 sm:p-6 lg:col-span-8 lg:p-9">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
              <span className="rounded-full bg-accent px-3 py-0.5 text-[10px] font-black uppercase text-accent-foreground">
                {activeArticle.category}
              </span>
              <span>· {activeArticle.readTime}</span>
              <span>· Actualizado {activeArticle.publishedAt}</span>
            </div>

            <h1 className="mt-3 font-serif text-2xl leading-tight sm:text-4xl">
              {activeArticle.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{activeArticle.subtitle}</p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-5 border-y border-primary/15 py-5">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={activeArticle.heroImage}
                  alt={activeArticle.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fb = resolveBlogFallbackImage(0);
                    if (!target.src.endsWith(fb)) target.src = fb;
                  }}
                  className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
                />
                <div className="min-w-0 break-words">
                  <p className="text-xs font-black uppercase tracking-wider text-primary">
                    {activeArticle.oemSavingsHighlight}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Temas: {activeArticle.targetKeywords.join(" · ")}
                  </p>
                </div>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-95"
              >
                <Search className="h-3.5 w-3.5 text-accent" />
                Buscar recambios "{activeArticle.relatedSearchQuery}"
              </Link>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-foreground/90">
              {activeArticle.summary}
            </p>

            <div className="mt-6 space-y-6">
              {activeArticle.sections.map((sec, idx) => (
                <div key={idx} className="space-y-3">
                  <h2 className="font-display text-lg font-black">{sec.heading}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{sec.body}</p>

                  {sec.specsTable && (
                    <div className="overflow-x-auto rounded-2xl border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-secondary/70 text-[10px] font-black uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Parámetro Técnico</th>
                            <th className="px-4 py-3">Especificación OEM Original</th>
                            <th className="px-4 py-3">Alternativa Aftermarket / Mod</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sec.specsTable.map((row, rIdx) => (
                            <tr key={rIdx} className="bg-card/60">
                              <td className="px-4 py-3 font-bold">{row.param}</td>
                              <td className="px-4 py-3 text-muted-foreground">{row.oemValue}</td>
                              <td className="px-4 py-3 font-semibold text-emerald-800">
                                {row.aftermarketValue}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* FAQs Section */}
            <div className="mt-8 rounded-2xl border border-border bg-secondary/25 p-5">
              <h3 className="flex items-center gap-2 font-display text-sm font-black uppercase tracking-wider">
                <Wrench className="h-4 w-4 text-primary" /> Preguntas Frecuentes de Taller
              </h3>
              <div className="mt-4 space-y-3">
                {activeArticle.faqs.map((faq, fIdx) => (
                  <div key={fIdx} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-black">{faq.q}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
