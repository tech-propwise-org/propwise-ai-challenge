'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { api, ApiError, LeadSummary, Page } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useRequiredSession, useSession } from '@/lib/session';

const PAGE_SIZE = 20;

export default function LeadsPage() {
  const session = useRequiredSession();
  const { logout } = useSession();
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<Page<LeadSummary> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    api
      .listLeads(session.token, { limit: PAGE_SIZE, offset })
      .then((result) => !cancelled && setPage(result))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) return logout();
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load leads');
      });
    return () => {
      cancelled = true;
    };
  }, [session, offset, logout]);

  if (!session) return null;
  const timeZone = session.agent.timezone;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">Leads</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!page && !error && <p className="text-sm text-gray-500">Loading…</p>}
        {page && page.items.length === 0 && <p className="text-sm text-gray-500">No leads yet.</p>}
        {page && page.items.length > 0 && (
          <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
            {page.items.map((lead) => (
              <li key={lead.id}>
                <Link href={`/leads/${lead.id}`} className="block px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{lead.name}</span>
                      <StatusBadge status={lead.status} />
                    </div>
                    <span className="shrink-0 text-xs text-gray-500">{formatDateTime(lead.updatedAt, timeZone)}</span>
                  </div>
                  {lead.lastMessage && (
                    <p className="mt-1 truncate text-sm text-gray-600" dir="auto">
                      {lead.lastMessage.direction === 'outbound' ? 'You: ' : ''}
                      {lead.lastMessage.body}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {page && page.total > PAGE_SIZE && (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="rounded-md border border-gray-300 px-2 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, page.total)} of {page.total}
            </span>
            <button
              disabled={offset + PAGE_SIZE >= page.total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="rounded-md border border-gray-300 px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </>
  );
}
