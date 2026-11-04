import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck, FileHeart, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedData Exchange — Privacy-first healthcare data marketplace" },
      { name: "description", content: "List, discover and license anonymized FHIR healthcare datasets with patient consent controls." },
      { property: "og:title", content: "MedData Exchange" },
      { property: "og:description", content: "Privacy-first marketplace for anonymized FHIR healthcare datasets." },
    ],
  }),
  component: AuthPage,
});

export function isStrongPassword(p: string) {
  return p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^a-zA-Z0-9]/.test(p);
}

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [accountType, setAccountType] = useState("provider");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/catalog" });
  }, [user, navigate]);

  const score = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!isStrongPassword(password)) {
          toast.error("Use 8+ characters with upper, lower, number and symbol.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username || email.split("@")[0], account_type: accountType },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  };

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <section className="rounded-2xl bg-hero p-10 text-primary-foreground">
        <p className="text-sm uppercase tracking-widest opacity-80">Healthcare data marketplace</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">Share research-grade data. Keep patients private.</h1>
        <ul className="mt-8 space-y-4 text-sm">
          <li className="flex gap-3"><FileHeart className="size-5 shrink-0" /> FHIR-standardized datasets from hospitals and labs</li>
          <li className="flex gap-3"><Fingerprint className="size-5 shrink-0" /> k-anonymity applied to sample records</li>
          <li className="flex gap-3"><ShieldCheck className="size-5 shrink-0" /> Consent you can grant or revoke at any time</li>
        </ul>
      </section>

      <form onSubmit={submit} className="rounded-2xl border bg-card p-8 shadow-card">
        <div className="mb-6 inline-flex rounded-full bg-muted p-1 text-sm">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-1.5 font-medium ${mode === m ? "bg-card shadow-card" : "text-muted-foreground"}`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.org" />
          </div>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="username">Display name</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Dr. Rao" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type={show ? "text" : "password"} required className="px-9" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mode === "signup" && (
              <div className="pt-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full transition-all ${score >= 4 ? "bg-success" : score >= 2 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${(score / 4) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">8+ characters with upper, lower, number and symbol</p>
              </div>
            )}
          </div>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="type">I am a</Label>
              <select id="type" value={accountType} onChange={(e) => setAccountType(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="provider">Provider</option>
                <option value="researcher">Researcher</option>
                <option value="pharma">Pharma</option>
                <option value="user">Patient / user</option>
              </select>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {mode === "login" ? "Log in" : "Create account"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
      </form>
    </div>
  );
}
