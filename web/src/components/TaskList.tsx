import type { Task } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

interface Props {
  tasks: Task[];
  timeZone: string;
  onToggle: (task: Task) => void;
}

export function TaskList({ tasks, timeZone, onToggle }: Props) {
  if (tasks.length === 0) {
    return <p className="text-sm text-gray-500">No tasks for this lead.</p>;
  }
  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={task.status === 'done'}
            onChange={() => onToggle(task)}
            aria-label={`Mark "${task.title}" as ${task.status === 'done' ? 'open' : 'done'}`}
          />
          <div>
            <p className={task.status === 'done' ? 'text-gray-400 line-through' : ''}>{task.title}</p>
            <p className="text-xs text-gray-500">
              {task.dueAt ? `Due ${formatDateTime(task.dueAt, timeZone)}` : 'No due date'}
              {task.notes ? ` · ${task.notes}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
