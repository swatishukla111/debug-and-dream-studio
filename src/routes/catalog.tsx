import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Database, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/privacy";

export const Route = createFileRoute("/catalog")({
  validateSearch: (s: Record<string, unknown>): { provider?: string } =>
    typeof s["provider"] === "string" ? { provider: s["provider"] } : {},
  head: () => ({
    meta: [
      { title: "Dataset Catalog — MedData Exchange" },
      { name: "description", content: "Browse anonymized FHIR healthcare datasets by category and provider." },
      { property: "og:title", content: "Dataset Catalog — MedData Exchange" },
      { property: "og:description", content: "Browse anonymized healthcare datasets." },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const { provider } = Route.useSearch();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["datasets", q, category, provider],
    queryFn: async () => {
      let query = supabase.from("datasets").select("*").order("listing_date", { ascending: false });
      const clean = (v: string) => v.replace(/[%,()]/g, "");
      if (q) query = query.or(`title.ilike.%${clean(q)}%,description.ilike.%${clean(q)}%,provider.ilike.%${clean(q)}%`);
      if (category) query = query.ilike("category", `%${clean(category)}%`);
      if (provider) query = query.eq("provider", provider);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <PageTitle title="Marketplace catalog" sub={provider ? `Datasets from ${provider}` : "Anonymized datasets ready for licensing"} />
      {provider && <Link to="/catalog" search={{}} className="mb-4 inline-block text-sm text-primary underline">Clear provider filter</Link>}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search datasets…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">No datasets match.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((d) => (
            <article key={d.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="size-4 text-primary" /> #{d.id} · {d.provider}
              </div>
              <h3 className="mt-2 text-lg font-semibold">{d.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{d.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {d.category && <Badge variant="secondary">{d.category}</Badge>}
                  <Badge variant="outline">{d.format}</Badge>
                </div>
                <span className="font-display font-semibold text-primary">{formatINR(Number(d.price))}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
