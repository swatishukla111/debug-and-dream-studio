import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageTitle, RequireAuth } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/privacy";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — MedData Exchange" },
      { name: "description", content: "Your listings, value and consents at a glance." },
      { property: "og:title", content: "My Dashboard — MedData Exchange" },
      { property: "og:description", content: "Your marketplace activity at a glance." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard", user!.id],
    queryFn: async () => {
      const [ds, cs] = await Promise.all([
        supabase.from("datasets").select("id,title,price,category,listing_date").eq("owner_id", user!.id).order("listing_date", { ascending: false }),
        supabase.from("consents").select("status"),
      ]);
      return { datasets: ds.data ?? [], consents: cs.data ?? [] };
    },
  });
  const ds = data?.datasets ?? [];
  const stats = [
    { label: "Datasets listed", value: ds.length },
    { label: "Listed value", value: formatINR(ds.reduce((s, d) => s + Number(d.price), 0)) },
    { label: "Active consents", value: data?.consents.filter((c) => c.status === "granted").length ?? 0 },
  ];
  return (
    <>
      <PageTitle title="Dashboard" sub={user?.email ?? ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold text-primary">{s.value}</p>
          </div>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-xl font-semibold">Your listings</h2>
      {ds.length === 0 ? (
        <p className="text-muted-foreground">You haven't listed any datasets yet.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card shadow-card">
          {ds.map((d) => (
            <li key={d.id} className="flex justify-between p-4 text-sm"><span>{d.title}</span><span className="font-medium">{formatINR(Number(d.price))}</span></li>
          ))}
        </ul>
      )}
    </>
  );
}
