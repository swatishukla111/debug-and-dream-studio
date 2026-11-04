import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle, RequireAuth } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { patientToFhir } from "@/lib/privacy";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "List a Dataset — MedData Exchange" },
      { name: "description", content: "List a new anonymized dataset and preview FHIR conversion." },
      { property: "og:title", content: "List a Dataset — MedData Exchange" },
      { property: "og:description", content: "List a new anonymized healthcare dataset." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Upload />
    </RequireAuth>
  ),
});

const empty = { title: "", description: "", provider: "", price: "", category: "", format: "FHIR" };

function Upload() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [fhir, setFhir] = useState<unknown>(null);
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(f.price);
    if (!f.title || !f.description || !f.provider || !Number.isFinite(price) || price < 0) {
      toast.error("Title, description, provider and a valid price are required.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("datasets").insert({
      title: f.title, description: f.description, provider: f.provider, price,
      category: f.category || null, format: f.format, owner_id: user!.id,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Dataset listed");
    setF(empty);
    qc.invalidateQueries();
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      setFhir(patientToFhir(JSON.parse(await file.text())));
    } catch {
      toast.error("Could not convert. Use a JSON file with patient_id, first_name, last_name.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="List a new dataset" sub="Your listing appears in the catalog immediately" />
      <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-card p-6 shadow-card sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" value={f.title} onChange={set("title")} /></div>
        <div className="space-y-1.5"><Label htmlFor="provider">Provider</Label><Input id="provider" value={f.provider} onChange={set("provider")} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="desc">Description</Label><Textarea id="desc" value={f.description} onChange={set("description")} /></div>
        <div className="space-y-1.5"><Label htmlFor="price">Price (INR)</Label><Input id="price" type="number" min="0" value={f.price} onChange={set("price")} /></div>
        <div className="space-y-1.5"><Label htmlFor="cat">Category</Label><Input id="cat" value={f.category} onChange={set("category")} /></div>
        <div className="space-y-1.5">
          <Label htmlFor="fmt">Format</Label>
          <select id="fmt" value={f.format} onChange={set("format")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option>FHIR</option><option>CSV</option><option>JSON</option>
          </select>
        </div>
        <div className="flex items-end"><Button type="submit" disabled={busy} className="w-full">Submit listing</Button></div>
      </form>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
        className={`mt-6 block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${drag ? "border-primary bg-secondary" : "bg-card"}`}
      >
        <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <UploadCloud className="mx-auto size-8 text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Drop or choose a patient JSON file to preview its FHIR conversion</p>
      </label>
      {fhir != null && <pre className="mt-4 overflow-auto rounded-xl bg-muted p-4 text-xs">{JSON.stringify(fhir, null, 2)}</pre>}
    </div>
  );
}
