import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle, RequireAuth } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — MedData Exchange" },
      { name: "description", content: "Your account details." },
      { property: "og:title", content: "Profile — MedData Exchange" },
      { property: "og:description", content: "Your account details." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  ),
});

function Profile() {
  const { user } = useAuth();
  const { data, refetch } = useQuery({
    queryKey: ["profile", user!.id],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const [name, setName] = useState("");
  const [type, setType] = useState("provider");
  useEffect(() => {
    if (data) { setName(data.username); setType(data.account_type); }
  }, [data]);
  const save = async () => {
    const { error } = await supabase.from("profiles").update({ username: name, account_type: type }).eq("id", user!.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    refetch();
  };
  return (
    <div className="mx-auto max-w-md">
      <PageTitle title="Profile" sub={user?.email ?? ""} />
      <div className="space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <div className="space-y-1.5"><Label htmlFor="n">Display name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5">
          <Label htmlFor="t">Account type</Label>
          <select id="t" value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="provider">Provider</option><option value="researcher">Researcher</option><option value="pharma">Pharma</option><option value="user">Patient / user</option>
          </select>
        </div>
        <Button onClick={save} className="w-full">Save</Button>
      </div>
    </div>
  );
}
