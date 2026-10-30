import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Code2 } from "lucide-react";
import { AurikNavbar } from "@/components/AurikNavbar";
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
        title: "Blog de Relojería & Guías Técnicas — Cronora",
      },
      {
        name: "description",
        content:
          "Tablas maestras de compatibilidad Seiko NH35 vs ETA 2824, medidas de cristales de zafiro SKX007, referencias OEM Rolex 124300 y correas integradas Tissot PRX.",
      },
      {
        property: "og:title",
        content: "Blog de Relojería y Guías Técnicas — Cronora",
      },
      {
        property: "og:description",
        content:
          "Guías de compatibilidad, calibres, cristales y recambios OEM frente a aftermarket.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    SEO_BLOG_ARTICLES[0]?.slug ?? ""
  );
  const [showJsonLd, setShowJsonLd] = useState(false);

  const activeArticle: BlogArticle | undefined =
    SEO_BLOG_ARTICLES.find((a) => a.slug === selectedSlug) ??
    SEO_BLOG_ARTICLES[0];
  const jsonLdObj = buildBlogJsonLd(SEO_BLOG_ARTICLES);

  if (!activeArticle) {
    return (
      <p className="p-6 font-mono text-xs uppercase text-[#111111]">
        NO HAY ARTÍCULOS DISPONIBLES.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdObj) }}
      />

      {/* Shared CRONORA Top Bar */}
      <AurikNavbar />

      <main className="mx-auto max-w-[1440px] px-4 py-10 sm:px-8 sm:py-16">
        {/* Editorial Header matching 3.webp / 4.webp */}
        <div className="grid grid-cols-1 gap-6 border-b border-[#e5e5e5] pb-10 lg:grid-cols-12 lg:gap-8 lg:pb-12">
          <div className="lg:col-span-4">
            <div className="aurik-section-tag">
              <span className="aurik-dot" />
              <span>01 // DOCUMENTACIÓN Y GUÍAS DE TALLER</span>
            </div>
          </div>

          <div className="lg:col-span-8">
            <h1 className="aurik-hero-title text-2xl sm:text-4xl">
              Manuales de compatibilidad, planos de tolerancia y equivalencias
              de calibres mecánicos
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link to="/" className="aurik-btn-gray">
                <span>VOLVER A INICIO</span>
                <span>&gt;</span>
              </Link>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="aurik-btn-gray"
              >
                <span>SITEMAP.XML</span>
                <span>&gt;</span>
              </a>
              <button
                type="button"
                onClick={() => setShowJsonLd((s) => !s)}
                className="aurik-btn-red"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>
                  {showJsonLd ? "OCULTAR SCHEMA.ORG" : "SCHEMA.ORG JSON-LD"}
                </span>
                <span>&gt;</span>
              </button>
            </div>
          </div>
        </div>

        {showJsonLd && (
          <div className="mt-8 border border-[#111111] bg-[#111111] p-4 text-white sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 pb-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#e03127]">
                ● DATOS ESTRUCTURADOS // TECHARTICLE + FAQPAGE + WEBSITE
              </span>
              <span className="font-mono text-[10px] uppercase text-white/70">
                INDEXACIÓN ACTIVA EN &lt;HEAD&gt;
              </span>
            </div>
            <pre className="mt-4 max-h-60 overflow-auto bg-black p-4 font-mono text-[11px] text-[#f4f4f5]">
              {JSON.stringify(jsonLdObj, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-8 sm:mt-12 lg:grid-cols-12">
          {/* Sidebar List of Technical Guides */}
          <aside className="space-y-4 lg:col-span-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
              ÍNDICE DE EXPEDIENTES ({SEO_BLOG_ARTICLES.length})
            </p>
            {SEO_BLOG_ARTICLES.map((art, idx) => {
              const active = art.slug === activeArticle.slug;
              return (
                <button
                  key={art.slug}
                  type="button"
                  onClick={() => setSelectedSlug(art.slug)}
                  className={`w-full border p-4 text-left transition-colors ${
                    active
                      ? "border-2 border-[#e03127] bg-[#f4f4f5]"
                      : "border-[#e5e5e5] bg-white hover:border-[#111111]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden border border-[#e5e5e5] bg-[#f4f4f5] p-1">
                      <img
                        src={art.heroImage}
                        alt={art.title}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fb = resolveBlogFallbackImage(idx);
                          if (!target.src.endsWith(fb)) target.src = fb;
                        }}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#71717a]">
                        <span className="truncate">{art.category}</span>
                        <span className="shrink-0">{art.readTime}</span>
                      </div>
                      <h3 className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-[#111111]">
                        {art.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-3 border-t border-[#e5e5e5] pt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[#e03127]">
                    ● {art.oemSavingsHighlight}
                  </p>
                </button>
              );
            })}
          </aside>

          {/* Active Article Full Technical Sheet */}
          <article className="min-w-0 border border-[#e5e5e5] bg-white p-5 sm:p-10 lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e5e5] pb-4 font-mono text-[11px] uppercase tracking-[0.08em] text-[#71717a]">
              <span className="bg-[#f4f4f5] px-2.5 py-1 text-[#e03127]">
                ● {activeArticle.category}
              </span>
              <span>// {activeArticle.readTime}</span>
              <span>// ACTUALIZADO {activeArticle.publishedAt}</span>
            </div>

            <h2 className="aurik-hero-title mt-6 text-xl sm:text-3xl">
              {activeArticle.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#52525b]">
              {activeArticle.subtitle}
            </p>

            {/* Highlight & Action Box */}
            <div className="mt-6 flex flex-col justify-between gap-4 border border-[#e5e5e5] bg-[#f4f4f5] p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.05em] text-[#e03127]">
                  ● {activeArticle.oemSavingsHighlight}
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.04em] text-[#71717a]">
                  DESCRIPTORES: {activeArticle.targetKeywords.join(" · ")}
                </p>
              </div>
              <Link to="/" className="aurik-btn-red self-start sm:self-auto">
                <span>BUSCAR &ldquo;{activeArticle.relatedSearchQuery}&rdquo;</span>
                <span>&gt;</span>
              </Link>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-[#111111]">
              {activeArticle.summary}
            </p>

            {/* Sections & Technical Tables */}
            <div className="mt-8 space-y-10">
              {activeArticle.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="space-y-4 border-t border-[#e5e5e5] pt-6"
                >
                  <h3 className="aurik-hero-title text-base sm:text-lg">
                    0{idx + 1} // {sec.heading}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#3f3f46]">
                    {sec.body}
                  </p>

                  {sec.specsTable && (
                    <div className="overflow-x-auto border border-[#e5e5e5]">
                      <table className="w-full min-w-[480px] text-left text-xs">
                        <thead className="border-b border-[#e5e5e5] bg-[#f4f4f5] font-mono text-[10px] uppercase tracking-[0.08em] text-[#71717a]">
                          <tr>
                            <th className="px-4 py-3">PARÁMETRO TÉCNICO</th>
                            <th className="px-4 py-3">
                              ESPECIFICACIÓN OEM ORIGINAL
                            </th>
                            <th className="px-4 py-3">
                              ALTERNATIVA AFTERMARKET / MOD
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e5e5]">
                          {sec.specsTable.map((row, rIdx) => (
                            <tr key={rIdx} className="bg-white">
                              <td className="px-4 py-3 font-semibold text-[#111111]">
                                {row.param}
                              </td>
                              <td className="px-4 py-3 text-[#52525b]">
                                {row.oemValue}
                              </td>
                              <td className="px-4 py-3 font-semibold text-[#e03127]">
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
            <div className="mt-10 border border-[#e5e5e5] bg-[#f4f4f5] p-5 sm:p-6">
              <div className="aurik-section-tag">
                <span className="aurik-dot" />
                <span>PREGUNTAS FRECUENTES DE TALLER</span>
              </div>
              <div className="mt-4 space-y-3">
                {activeArticle.faqs.map((faq, fIdx) => (
                  <div
                    key={fIdx}
                    className="border border-[#e5e5e5] bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-[#111111]">
                      {faq.q}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#52525b] sm:text-sm">
                      {faq.a}
                    </p>
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
