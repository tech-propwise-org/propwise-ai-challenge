'use client';

import Link from 'next/link';
import { useSession } from '@/lib/session';

export function AppHeader() {
  const { session, logout } = useSession();
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/leads" className="font-semibold">
          Propwise Mini CRM
        </Link>
        {session && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="hidden sm:inline">
              {session.agent.name} · {session.agent.agency.name}
            </span>
            <button onClick={logout} className="rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50">
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
