import { createContext, useContext, useEffect, useState, type ReactNode, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LogIn, LogOut, UserRound } from "lucide-react";

const AccountContext = createContext<{ user: User | null; ready: boolean; openAuth: () => void; signOut: () => Promise<void> }>({ user: null, ready: false, openAuth: () => {}, signOut: async () => {} });
export const useAccount = () => useContext(AccountContext);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let active = true;
    const verify = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) { setUser(data.user); setReady(true); if (data.user) { setOpen(false); setPassword(""); } }
    };
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      if (event === "SIGNED_OUT") { setUser(null); queryClient.clear(); }
      else { void verify(); void queryClient.invalidateQueries(); }
      void router.invalidate();
    });
    void verify();
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [router, queryClient]);
  const signOut = async () => {
    await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setMessage(error.message); return; }
    setUser(null);
    await router.navigate({ to: "/", replace: true });
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } } });
        if (error) throw error;
        if (!data.session) setMessage("Revisa tu correo y confirma tu cuenta antes de iniciar sesión.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo acceder. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  };
  return <AccountContext.Provider value={{ user, ready, openAuth: () => { setMessage(""); setOpen(true); }, signOut }}>
    {children}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg p-5 sm:p-6">
        <DialogTitle className="pr-6 font-serif text-3xl leading-tight">{mode === "signup" ? "Crea tu cuenta gratis en ChronoParts" : "Iniciar Sesión"}</DialogTitle>
        <DialogDescription>Registrarse es gratis: guarda piezas en Mi Caja, sincronízalas en la nube y accede a hasta 5 búsquedas extensas diarias.</DialogDescription>
        <div className="grid grid-cols-2 gap-2">
          <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => { setMode("signup"); setMessage(""); }}>Crear cuenta</Button>
          <Button variant={mode === "login" ? "default" : "outline"} onClick={() => { setMode("login"); setMessage(""); }}>Iniciar Sesión</Button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          {mode === "signup" && <label className="block space-y-2 text-sm font-bold">Nombre visible<input value={name} onChange={e => setName(e.target.value)} autoComplete="nickname" className="h-12 w-full rounded-md border bg-card px-3 font-normal" required maxLength={100} /></label>}
          <label className="block space-y-2 text-sm font-bold">Correo electrónico<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="h-12 w-full rounded-md border bg-card px-3 font-normal" required /></label>
          <label className="block space-y-2 text-sm font-bold">Contraseña<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} className="h-12 w-full rounded-md border bg-card px-3 font-normal" required /></label>
          {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
          <Button type="submit" disabled={busy} className="min-h-12 w-full"><LogIn />{busy ? "Un momento…" : mode === "signup" ? "Crear cuenta gratis" : "Entrar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </AccountContext.Provider>;
}

export function AccountControls() {
  const { user, ready, openAuth, signOut } = useAccount();
  if (!user) return <Button variant="outline" className="min-h-11 shrink-0 rounded-full" onClick={openAuth} disabled={!ready}><LogIn />Crear cuenta / Entrar</Button>;
  const name = typeof user.user_metadata["display_name"] === "string" ? user.user_metadata["display_name"] : user.email;
  return <><span className="flex max-w-44 shrink-0 items-center gap-2 text-xs font-bold"><UserRound className="h-4 w-4 shrink-0" /><span className="truncate">{name}</span></span><Button variant="outline" className="min-h-11 shrink-0 rounded-full" onClick={() => void signOut()}><LogOut />Salir</Button></>;
}