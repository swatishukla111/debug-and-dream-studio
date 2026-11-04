import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ShieldCheck, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const links = [
  { to: "/catalog", label: "Catalog" },
  { to: "/providers", label: "Providers" },
  { to: "/upload", label: "Upload" },
  { to: "/consents", label: "Consents" },
  { to: "/revenue", label: "Revenue" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-hero text-primary-foreground">
              <ShieldCheck className="size-4" />
            </span>
            MedData Exchange
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                activeProps={{ className: "bg-secondary !text-secondary-foreground font-semibold" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link to="/profile" className="grid size-8 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground" title="Profile">
                  {(user.email ?? "?").slice(0, 2).toUpperCase()}
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut /> Log out
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link to="/">Log in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!user)
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center shadow-card">
        <h2 className="text-xl font-semibold">Please log in</h2>
        <p className="mt-2 text-sm text-muted-foreground">You need an account to use this page.</p>
        <Button className="mt-4" asChild>
          <Link to="/">Log in or sign up</Link>
        </Button>
      </div>
    );
  return <>{children}</>;
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-semibold">{title}</h1>
      {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
    </div>
  );
}
