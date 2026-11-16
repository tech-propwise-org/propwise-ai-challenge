import type { LeadDetail } from '@/lib/api';

/**
 * Placeholder for the AI assistant. See TASK.md: this is where the analysis of the lead's
 * latest message, the recommended properties and the follow-up task waiting for approval go.
 */
export function AssistantPanel({ lead }: { lead: LeadDetail }) {
  const hasInbound = lead.messages.some((message) => message.direction === 'inbound');
  return (
    <section className="rounded-xl border border-dashed border-gray-300 bg-white p-4">
      <h2 className="font-semibold">AI assistant</h2>
      <p className="mt-1 text-sm text-gray-500">Not built yet.</p>
      <button
        type="button"
        disabled
        className="mt-3 rounded-md bg-gray-900 px-3 py-2 text-sm text-white opacity-40"
        title={hasInbound ? undefined : 'This lead has not sent a message yet'}
      >
        Analyze latest message
      </button>
    </section>
  );
}
