import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageTitle } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/privacy";

export const Route = createFileRoute("/revenue")({
  head: () => ({
    meta: [
      { title: "Revenue Analytics — MedData Exchange" },
      { name: "description", content: "Listing value by category and provider." },
      { property: "og:title", content: "Revenue Analytics — MedData Exchange" },
      { property: "og:description", content: "Listing value by category." },
    ],
  }),
  component: Revenue,
});

export function groupByCategory(rows: { category: string | null; price: number }[]) {
  const m = new Map<string, { category: string; count: number; revenue: number }>();
  for (const r of rows) {
    const k = r.category || "Uncategorized";
    const e = m.get(k) ?? { category: k, count: 0, revenue: 0 };
    e.count++;
    e.revenue += Number(r.price);
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue);
}

function Revenue() {
  const { data = [] } = useQuery({
    queryKey: ["revenue"],
    queryFn: async () => groupByCategory((await supabase.from("datasets").select("category,price")).data ?? []),
  });
  const total = data.reduce((s, d) => s + d.revenue, 0);
  return (
    <>
      <PageTitle title="Revenue analytics" sub={`Total listed value ${formatINR(total)}`} />
      <div className="h-80 rounded-xl border bg-card p-4 shadow-card">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatINR(v)} />
            <Bar dataKey="revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="mt-6 w-full overflow-hidden rounded-xl border bg-card text-sm shadow-card">
        <thead className="bg-muted text-left"><tr><th className="p-3">Category</th><th className="p-3">Datasets</th><th className="p-3 text-right">Value</th></tr></thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.category} className="border-t"><td className="p-3">{d.category}</td><td className="p-3">{d.count}</td><td className="p-3 text-right">{formatINR(d.revenue)}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
