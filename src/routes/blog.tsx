import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Code2,
  Search,
  Wrench,
} from "lucide-react";
import {
  SEO_BLOG_ARTICLES,
  buildBlogJsonLd,
  resolveBlogFallbackImage,
  type BlogArticle,
} from "@/lib/seo-blog";
import { AccountControls } from "@/components/AccountProvider";

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

  const activeArticle: BlogArticle | undefined =
    SEO_BLOG_ARTICLES.find((a) => a.slug === selectedSlug) ?? SEO_BLOG_ARTICLES[0];
  const jsonLdObj = buildBlogJsonLd(SEO_BLOG_ARTICLES);

  if (!activeArticle) return <p className="p-6 text-foreground">No hay artículos disponibles.</p>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdObj) }}
      />

      {/* Apple Level 1 Global Nav (#000000, 44px) */}
      <nav className="sticky top-0 z-50 h-[44px] w-full bg-apple-black text-foreground">
        <div className="mx-auto flex h-full max-w-[1024px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-[14px] font-semibold text-foreground">
            ChronoParts
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link to="/" className="apple-nav-link hidden text-foreground/80 hover:text-foreground sm:inline">
              Buscador
            </Link>
            <Link to="/marketplace" className="apple-nav-link text-foreground/80 hover:text-foreground">
              Marketplace
            </Link>
            <span className="apple-nav-link text-foreground">Blog</span>
          </div>
        </div>
      </nav>

      {/* Apple Level 2 Sub-nav Frosted (#f5f5f7/80, 52px) */}
      <header className="sticky top-[44px] z-40 border-b border-border bg-secondary/80 apple-frosted">
        <div className="mx-auto flex min-h-[52px] max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-[12px] font-normal text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al Buscador
            </Link>
            <span className="text-[19px] font-semibold text-foreground">
              Guías Técnicas de Relojería
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AccountControls />
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] font-normal text-foreground hover:text-primary"
            >
              Sitemap.xml ↗
            </a>
            <Button variant="unstyled"
              onClick={() => setShowJsonLd((s) => !s)}
              className="inline-flex items-center gap-1.5 rounded-full bg-ring px-3.5 py-1.5 text-[12px] font-normal text-foreground transition-transform active:scale-95"
            >
              <Code2 className="h-3.5 w-3.5" />
              {showJsonLd ? "Ocultar Schema.org" : "Schema.org JSON-LD"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-14">
        {showJsonLd && (
          <div className="mb-8 rounded-[18px] bg-apple-tile-1 p-6 text-foreground">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
              <span className="text-[12px] font-semibold uppercase text-apple-primary-dark">
                Datos Estructurados · TechArticle + FAQPage + WebSite
              </span>
              <span className="text-[12px] text-muted-foreground">Indexación activa en &lt;head&gt;</span>
            </div>
            <pre className="max-h-60 overflow-auto rounded-[12px] bg-foreground p-4 font-mono text-[11px] text-secondary">
              {JSON.stringify(jsonLdObj, null, 2)}
            </pre>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Sidebar list of guides */}
          <aside className="space-y-3 lg:col-span-4">
            <p className="text-[12px] font-semibold uppercase text-muted-foreground">
              Artículos del Blog ({SEO_BLOG_ARTICLES.length})
            </p>
            {SEO_BLOG_ARTICLES.map((art, idx) => {
              const active = art.slug === activeArticle.slug;
              return (
                <Button variant="unstyled"
                  key={art.slug}
                  onClick={() => setSelectedSlug(art.slug)}
                  className={`w-full rounded-[16px] border p-4 text-left transition ${
                    active
                      ? "border-ring bg-secondary text-foreground ring-1 ring-ring"
                      : "border-border bg-background hover:border-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={art.heroImage}
                      alt={art.title}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fb = resolveBlogFallbackImage(idx);
                        if (!target.src.endsWith(fb)) target.src = fb;
                      }}
                      className="h-14 w-14 shrink-0 rounded-[12px] border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase text-muted-foreground">
                        <span className="truncate">{art.category}</span>
                        <span className="shrink-0">{art.readTime}</span>
                      </div>
                      <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-[1.28] text-foreground">
                        {art.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-2 text-[12px] font-semibold text-primary">
                    {art.oemSavingsHighlight}
                  </p>
                </Button>
              );
            })}
          </aside>

          {/* Active article full content */}
          <article className="min-w-0 border-t border-border bg-background pt-6 sm:p-8 lg:col-span-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2 text-[12px] font-normal text-muted-foreground">
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase text-primary">
                {activeArticle.category}
              </span>
              <span>· {activeArticle.readTime}</span>
              <span>· Actualizado {activeArticle.publishedAt}</span>
            </div>

            <h1 className="apple-display-lg mt-4 text-[28px] text-foreground sm:text-[36px]">
              {activeArticle.title}
            </h1>
            <p className="apple-lead mt-2 text-[17px] text-muted-foreground">{activeArticle.subtitle}</p>

            <div className="mt-6 min-w-0 flex flex-wrap items-center justify-between gap-4 rounded-[16px] bg-secondary p-5">
              <div className="flex items-center gap-3.5">
                <img
                  src={activeArticle.heroImage}
                  alt={activeArticle.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fb = resolveBlogFallbackImage(0);
                    if (!target.src.endsWith(fb)) target.src = fb;
                  }}
                  className="h-16 w-16 shrink-0 rounded-[12px] border border-border object-cover"
                />
                <div>
                  <p className="text-[14px] font-semibold text-primary">
                    {activeArticle.oemSavingsHighlight}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Temas: {activeArticle.targetKeywords.join(" · ")}
                  </p>
                </div>
              </div>
              <Link
                to="/"
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-ring px-5 py-2.5 text-[14px] font-normal text-foreground transition-transform active:scale-95"
              >
                <Search className="h-4 w-4" />
                Buscar recambios "{activeArticle.relatedSearchQuery}"
              </Link>
            </div>

            <p className="apple-body mt-6 text-foreground">
              {activeArticle.summary}
            </p>

            <div className="mt-8 space-y-8">
              {activeArticle.sections.map((sec, idx) => (
                <div key={idx} className="space-y-3">
                  <h2 className="apple-tagline text-[21px] text-foreground">{sec.heading}</h2>
                  <p className="apple-body text-foreground">{sec.body}</p>

                  {sec.specsTable && (
                    <div className="overflow-x-auto rounded-[16px] border border-border">
                      <table className="w-full text-left text-[13px]">
                        <thead className="bg-secondary text-[11px] font-semibold uppercase text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3">Parámetro Técnico</th>
                            <th className="px-4 py-3">Especificación OEM Original</th>
                            <th className="px-4 py-3">Alternativa Aftermarket / Mod</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sec.specsTable.map((row, rIdx) => (
                            <tr key={rIdx} className="bg-background">
                              <td className="px-4 py-3 font-semibold text-foreground">{row.param}</td>
                              <td className="px-4 py-3 text-muted-foreground">{row.oemValue}</td>
                              <td className="px-4 py-3 font-semibold text-primary">
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
            <div className="mt-10 rounded-[18px] bg-secondary p-6">
              <h3 className="flex items-center gap-2 text-[17px] font-semibold text-foreground">
                <Wrench className="h-4 w-4 text-primary" /> Preguntas Frecuentes de Taller
              </h3>
              <div className="mt-4 space-y-3">
                {activeArticle.faqs.map((faq, fIdx) => (
                  <div key={fIdx} className="rounded-[14px] border border-border bg-background p-4">
                    <p className="text-[14px] font-semibold text-foreground">{faq.q}</p>
                    <p className="mt-1 text-[14px] leading-[1.47] text-muted-foreground">{faq.a}</p>
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
