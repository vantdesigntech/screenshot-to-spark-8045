import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { buildChronoPartsHeadMeta } from "../lib/seo-blog";
import { AccountProvider } from "@/components/AccountProvider";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 text-[#111111]">
      <div className="w-full max-w-md border border-[#e5e5e5] bg-[#f4f4f5] p-8 text-center">
        <div className="aurik-section-tag justify-center">
          <span className="aurik-dot" />
          <span>ERROR // 404</span>
        </div>
        <h1 className="aurik-hero-title mt-3 text-4xl text-[#111111]">
          Página no encontrada
        </h1>
        <p className="mt-3 text-xs leading-relaxed text-[#71717a]">
          La referencia o ruta solicitada no existe en el catálogo técnico de
          Cronora.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/" className="aurik-btn-red">
            <span>VOLVER A INICIO</span>
            <span>&gt;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 text-[#111111]">
      <div className="w-full max-w-md border border-[#e5e5e5] bg-[#f4f4f5] p-8 text-center">
        <div className="aurik-section-tag justify-center">
          <span className="aurik-dot" />
          <span>SYSTEM FAULT</span>
        </div>
        <h1 className="aurik-hero-title mt-3 text-xl text-[#111111]">
          Error al cargar la vista
        </h1>
        <p className="mt-3 text-xs text-[#71717a]">
          {error instanceof Error ? error.message : "Error inesperado."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              reset();
              router.invalidate();
            }}
            className="aurik-btn-red"
          >
            <span>REINTENTAR</span>
            <span>&gt;</span>
          </button>
          <a href="/" className="aurik-btn-gray">
            <span>IR A INICIO</span>
            <span>&gt;</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: buildChronoPartsHeadMeta(),
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://cronora.watch/" },
      { rel: "alternate", hrefLang: "es-ES", href: "https://cronora.watch/" },
      { rel: "alternate", hrefLang: "es", href: "https://cronora.watch/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Share+Tech+Mono&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AccountProvider>
        <Outlet />
      </AccountProvider>
    </QueryClientProvider>
  );
}
