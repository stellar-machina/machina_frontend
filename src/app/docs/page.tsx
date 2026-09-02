import { PageShell } from "@/components/PageShell";
import { CurlBlock } from "@/components/CurlBlock";
import { messages } from "@/lib/messages";
import { resolveApiBase } from "@/lib/resolveApiBase";
import { safeHref } from "@/lib/url";

export const metadata = { title: "Docs — Stellar Machina" };

export default function DocsPage() {
  const baseUrl = resolveApiBase();
  const sections = [
    {
      h: "POST /api/v1/usage",
      p: "Record incremental usage for an (agent, serviceId) pair. Body: { agent, serviceId, requests }.",
      curl: `curl -X POST ${baseUrl}/api/v1/usage \
  -H "Content-Type: application/json" \
  -d '{"agent":"agent-id","serviceId":"service-id","requests":1}'`,
    },
    {
      h: "GET /api/v1/usage/:agent/:serviceId",
      p: "Read the accumulated request total. Returns { agent, serviceId, total }.",
      curl: `curl ${baseUrl}/api/v1/usage/agent-id/service-id`,
    },
    {
      h: "POST /api/v1/settle",
      p: "Drain the accumulator and return { requests, priceStroops, billedStroops }.",
      curl: `curl -X POST ${baseUrl}/api/v1/settle \
  -H "Content-Type: application/json" \
  -d '{"agent":"agent-id"}'`,
    },
    {
      h: "POST /api/v1/services",
      p: "Register a service with priceStroops/request. Idempotent.",
      curl: `curl -X POST ${baseUrl}/api/v1/services \
  -H "Content-Type: application/json" \
  -d '{"name":"my-service","priceStroops":100}'`,
    },
    {
      h: "POST /api/v1/admin/{pause,unpause}",
      p: "Toggle the global pause flag; GET /admin/status to read.",
      curl: `curl -X POST ${baseUrl}/api/v1/admin/pause`,
    },
  ];

  const openApiLink = safeHref("/api/v1/openapi.json");
  const referenceLink = safeHref(
    "https://github.com/stellar-machina/machina_frontend/blob/main/docs/api-integration.md",
  );

  return (
    <PageShell maxWidth="3xl" gap="6">
      <h1 className="text-3xl font-semibold tracking-tight">{messages.docs.heading}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {messages.docs.introCompanionPrefix}
        {openApiLink.ok ? (
          <a className="underline" href={openApiLink.href}>
            {messages.docs.introOpenApi}
          </a>
        ) : (
          messages.docs.introOpenApi
        )}
        {messages.docs.introCompanionSuffix}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {messages.docs.referencePrefix}
        {referenceLink.ok ? (
          <a
            className="underline"
            href={referenceLink.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {messages.docs.referenceLink}
          </a>
        ) : (
          messages.docs.referenceLink
        )}
        {messages.docs.referenceSuffix}
      </p>
      <dl className="space-y-4">
        {sections.map((s) => (
          <div key={s.h}>
            <dt className="font-mono text-sm font-medium">{s.h}</dt>
            <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{s.p}</dd>
            <CurlBlock command={s.curl} />
          </div>
        ))}
      </dl>
    </PageShell>
  );
}
