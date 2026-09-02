"use client";

import { use, useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import { useApi } from "@/lib/useApi";
import { Breadcrumb } from "@/components/Breadcrumb";
import { formatRequests } from "@/lib/format";

type Usage = { agent: string; items: { serviceId: string; total: number }[] };
type TotalState = { agent: string; total: number } | null;

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agent: string }>;
}) {
  const { agent } = use(params);
  const encodedAgent = encodeURIComponent(agent);
  const usageState = useApi<Usage>(`/api/v1/agents/${encodedAgent}/usage`);
  const [totalState, setTotalState] = useState<TotalState>(null);

  useEffect(() => {
    let cancelled = false;

    apiGet<{ total: number }>(`/api/v1/agents/${encodedAgent}/total`)
      .then((b) => {
        if (!cancelled) setTotalState({ agent, total: b.total });
      })
      .catch(() => {
        /* total is optional */
      });

    return () => {
      cancelled = true;
    };
  }, [agent, encodedAgent]);

  const items = usageState.status === "ok" ? usageState.data.items : null;
  const error = usageState.status === "error" ? usageState.error : null;
  const total = totalState?.agent === agent ? totalState.total : null;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <Breadcrumb items={[{ label: "Agents", href: "/agents" }, { label: agent }]} />
      <h1 className="text-3xl font-semibold tracking-tight font-mono">{agent}</h1>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {total !== null && (
        <p className="text-sm">
          Lifetime total: <strong>{formatRequests(total)}</strong> requests
        </p>
      )}
      {items && items.length === 0 && (
        <p className="text-sm text-zinc-500">No services consumed yet.</p>
      )}
      {items && items.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((s) => (
            <li key={s.serviceId} className="flex items-center justify-between py-3 text-sm">
              <span className="font-mono">{s.serviceId}</span>
              <span>{formatRequests(s.total)} requests</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
