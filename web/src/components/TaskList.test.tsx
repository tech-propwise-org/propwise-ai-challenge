import { render, screen } from '@testing-library/react';
import type { Task } from '@/lib/api';
import { TaskList } from './TaskList';

const task: Task = {
  id: 't1',
  leadId: 'lead-1',
  title: 'Call Karim',
  notes: null,
  dueAt: null,
  status: 'open',
  createdBy: { id: 'a1', name: 'Sara Khan' },
  createdAt: '2026-10-15T10:00:00.000Z',
};

describe('TaskList', () => {
  it('says when the list is cut off', () => {
    render(<TaskList tasks={[task]} total={150} timeZone="Asia/Dubai" onToggle={() => undefined} />);
    expect(screen.getByText('Showing the first 1 of 150 tasks.')).toBeInTheDocument();
  });

  it('says nothing extra when every task is shown', () => {
    render(<TaskList tasks={[task]} total={1} timeZone="Asia/Dubai" onToggle={() => undefined} />);
    expect(screen.queryByText(/Showing the first/)).not.toBeInTheDocument();
  });
});
