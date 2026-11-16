import type { Message } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

export function MessageThread({ messages, timeZone }: { messages: Message[]; timeZone: string }) {
  if (messages.length === 0) {
    return <p className="text-sm text-gray-500">No messages yet.</p>;
  }
  return (
    <ol className="space-y-3">
      {messages.map((message) => {
        const inbound = message.direction === 'inbound';
        return (
          <li key={message.id} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                inbound ? 'bg-white ring-1 ring-gray-200' : 'bg-gray-900 text-white'
              }`}
            >
              <p className="whitespace-pre-wrap" dir="auto">
                {message.body}
              </p>
              <p className={`mt-1 text-xs ${inbound ? 'text-gray-500' : 'text-gray-300'}`}>
                {inbound ? 'From lead' : 'You'} · {message.channel} · {formatDateTime(message.sentAt, timeZone)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
