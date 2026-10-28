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
    <div className="flex min-h-screen items-center justify-center bg-card px-4 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="apple-hero-display text-[56px] text-foreground">404</h1>
        <h2 className="apple-tagline mt-3 text-[21px] text-foreground">Página no encontrada</h2>
        <p className="apple-body mt-2 text-muted-foreground">
          La página o referencia que buscas no existe o se ha movido dentro de ChronoParts.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-[22px] py-[11px] text-[17px] font-normal text-primary-foreground transition-transform active:scale-95 focus:outline-2 focus:outline-primary"
          >
            Volver al inicio
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
    <div className="flex min-h-screen items-center justify-center bg-card px-4 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="apple-tagline text-[21px] text-foreground">
          No se ha podido cargar esta página
        </h1>
        <p className="apple-body mt-2 text-muted-foreground">
          Ha ocurrido un problema puntual al cargar la vista. Puedes reintentar o volver al buscador.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-[22px] py-[11px] text-[17px] font-normal text-primary-foreground transition-transform active:scale-95 focus:outline-2 focus:outline-primary"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-primary bg-card px-[22px] py-[11px] text-[17px] font-normal text-primary transition-transform active:scale-95"
          >
            Ir al buscador
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
      { rel: "canonical", href: "https://chronoparts.watch/" },
      { rel: "alternate", hrefLang: "es-ES", href: "https://chronoparts.watch/" },
      { rel: "alternate", hrefLang: "es", href: "https://chronoparts.watch/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap",
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
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AccountProvider>
        <Outlet />
      </AccountProvider>
    </QueryClientProvider>
  );
}
