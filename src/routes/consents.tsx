import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageTitle, RequireAuth } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/consents")({
  head: () => ({
    meta: [
      { title: "Consent Controls — MedData Exchange" },
      { name: "description", content: "Grant or revoke consent for each dataset." },
      { property: "og:title", content: "Consent Controls — MedData Exchange" },
      { property: "og:description", content: "Manage your data-sharing consents." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Consents />
    </RequireAuth>
  ),
});

function Consents() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [datasetId, setDatasetId] = useState("");
  const datasets = useQuery({
    queryKey: ["datasets-min"],
    queryFn: async () => (await supabase.from("datasets").select("id,title").order("title")).data ?? [],
  });
  const consents = useQuery({
    queryKey: ["consents", user!.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("consents").select("*, datasets(title)").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["consents"] });

  const grant = async () => {
    if (!datasetId) { toast.error("Choose a dataset"); return; }
    const { error } = await supabase
      .from("consents")
      .upsert({ user_id: user!.id, dataset_id: Number(datasetId), status: "granted", updated_at: new Date().toISOString() }, { onConflict: "user_id,dataset_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Consent granted");
    refresh();
  };
  const toggle = async (id: number, status: string) => {
    const { error } = await supabase.from("consents").update({ status: status === "granted" ? "revoked" : "granted", updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  };

  return (
    <>
      <PageTitle title="Consent controls" sub="Decide which datasets may use your data. Change it any time." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h3 className="font-semibold">Grant new consent</h3>
          <select aria-label="Dataset" value={datasetId} onChange={(e) => setDatasetId(e.target.value)} className="mt-3 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Choose a dataset…</option>
            {datasets.data?.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
          <Button className="mt-3 w-full" onClick={grant}>Grant consent</Button>
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-2">
          {consents.data?.length === 0 && <p className="text-muted-foreground">No consents yet.</p>}
          {consents.data?.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-card">
              <div>
                <p className="font-medium">{c.datasets?.title ?? `Dataset #${c.dataset_id}`}</p>
                <Badge variant={c.status === "granted" ? "default" : "secondary"} className="mt-1">{c.status}</Badge>
              </div>
              <Switch checked={c.status === "granted"} onCheckedChange={() => toggle(c.id, c.status)} aria-label="Toggle consent" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
