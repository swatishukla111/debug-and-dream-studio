import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, FlaskConical, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/providers")({
  head: () => ({
    meta: [
      { title: "Data Providers — MedData Exchange" },
      { name: "description", content: "Hospitals and research labs sharing anonymized datasets." },
      { property: "og:title", content: "Data Providers — MedData Exchange" },
      { property: "og:description", content: "Hospitals and research labs on the marketplace." },
    ],
  }),
  component: Providers,
});

function Providers() {
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
  const t = q.toLowerCase();
  const list = data.filter((p) => [p.name, p.type, p.location].some((v) => v?.toLowerCase().includes(t)));
  return (
    <>
      <PageTitle title="Providers" sub="Hospitals and research institutions" />
      <Input className="mb-6 max-w-md" placeholder="Search by name, type or city…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Link key={p.id} to="/catalog" search={{ provider: p.name }} className="rounded-xl border bg-card p-5 shadow-card hover:border-primary">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                {p.type === "Research" ? <FlaskConical className="size-5" /> : <Building2 className="size-5" />}
              </span>
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3" /> {p.location} · {p.type}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
