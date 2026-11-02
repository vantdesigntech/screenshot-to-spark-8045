import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/components/AccountProvider";
import { AurikNavbar } from "@/components/AurikNavbar";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar o crear cuenta | ChronoParts" },
      { name: "description", content: "Accede a ChronoParts o crea tu cuenta gratis para guardar recambios en Mi Caja y crear listas de compra." },
      { property: "og:title", content: "Entrar o crear cuenta | ChronoParts" },
      { property: "og:description", content: "Guarda recambios favoritos y listas de compra en tu cuenta ChronoParts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function safePath(p: string | undefined) {
  return p && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/auth") ? p : "/mi-caja";
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready } = useAccount();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (ready && user) void navigate({ to: safePath(redirect), replace: true });
  }, [ready, user, redirect, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } },
      });
      if (err) setError(err.message);
      else if (!data.session) setInfo("Te hemos enviado un correo. Confírmalo para entrar.");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : err.message);
    }
    setBusy(false);
  };

  const field = "h-12 w-full rounded-md border border-border bg-background px-3.5 text-base text-foreground focus:outline-2 focus:outline-primary";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AurikNavbar />
      <main className="mx-auto max-w-md px-4 py-10 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight">{mode === "login" ? "Entrar" : "Crear cuenta gratis"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Guarda recambios en Mi Caja y organiza tus listas de compra.</p>
        <div role="tablist" className="mt-6 grid grid-cols-2 gap-2">
          {(["login", "signup"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => { setMode(m); setError(""); setInfo(""); }}
              className={`min-h-11 rounded-md border text-sm font-semibold ${mode === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
              {m === "login" ? "Entrar" : "Registrarse"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block space-y-1.5 text-sm font-semibold">Nombre visible
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="nickname" />
            </label>
          )}
          <label className="block space-y-1.5 text-sm font-semibold">Correo electrónico
            <input className={field} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="block space-y-1.5 text-sm font-semibold">Contraseña
            <input className={field} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {info && <p role="status" className="text-sm text-foreground">{info}</p>}
          <button type="submit" disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {busy ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground"><Link to="/" className="underline">Seguir sin cuenta</Link></p>
      </main>
    </div>
  );
}
