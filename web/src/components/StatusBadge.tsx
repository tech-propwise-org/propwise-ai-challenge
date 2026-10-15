import type { LeadStatus } from '@/lib/api';

const COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-slate-100 text-slate-800',
  qualified: 'bg-violet-100 text-violet-800',
  viewing: 'bg-amber-100 text-amber-800',
  negotiating: 'bg-orange-100 text-orange-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-gray-200 text-gray-600',
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[status]}`}>{status}</span>;
}
