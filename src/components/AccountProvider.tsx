import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface ChronoUser {
  id: string;
  email?: string | undefined;
  user_metadata: Record<string, unknown>;
}

const AccountContext = createContext<{
  user: ChronoUser | null;
  ready: boolean;
  openAuth: () => void;
  signOut: () => Promise<void>;
}>({ user: null, ready: false, openAuth: () => {}, signOut: async () => {} });

export const useAccount = () => useContext(AccountContext);

export function displayNameOf(user: ChronoUser) {
  const n = user.user_metadata["display_name"];
  return typeof n === "string" && n ? n : (user.email ?? "Mi cuenta");
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ChronoUser | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email, user_metadata: session.user.user_metadata ?? {} } : null);
      setReady(true);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void router.invalidate();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await router.navigate({ to: "/auth", replace: true });
  };

  const openAuth = () => {
    const path = window.location.pathname;
    void router.navigate({ to: "/auth", search: { redirect: path.startsWith("/") && !path.startsWith("//") ? path : "/" } });
  };

  return <AccountContext.Provider value={{ user, ready, openAuth, signOut }}>{children}</AccountContext.Provider>;
}

export function AccountControls() {
  const { user, ready, signOut } = useAccount();
  if (!user)
    return (
      <Link to="/auth" search={{ redirect: "/" }} aria-disabled={!ready} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12px] text-primary-foreground">
        <LogIn className="h-3.5 w-3.5" /> Entrar / Registrarse
      </Link>
    );
  return (
    <>
      <span className="flex max-w-44 shrink-0 items-center gap-2 text-[12px] font-semibold text-foreground">
        <UserRound className="h-4 w-4 shrink-0" />
        <span className="truncate">{displayNameOf(user)}</span>
      </span>
      <button className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 py-1.5 text-[12px] text-foreground" onClick={() => void signOut()}>
        <LogOut className="h-3.5 w-3.5" /> Salir
      </button>
    </>
  );
}
