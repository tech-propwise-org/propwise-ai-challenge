import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Task } from '../lib/api';
import { formatDateTime } from '../lib/format';

interface Props {
  tasks: Task[];
  /** How many the lead has; the list stops at 100. */
  total: number;
  timeZone: string;
  onToggle: (task: Task) => void;
}

export function TaskList({ tasks, total, timeZone, onToggle }: Props) {
  if (tasks.length === 0) {
    return <Text style={styles.empty}>No tasks for this lead.</Text>;
  }
  return (
    <View style={styles.list}>
      {total > tasks.length && (
        <Text style={styles.meta}>
          Showing the first {tasks.length} of {total} tasks.
        </Text>
      )}
      {tasks.map((task) => {
        const done = task.status === 'done';
        return (
          <Pressable
            key={task.id}
            style={styles.row}
            onPress={() => onToggle(task)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
          >
            <View style={[styles.box, done && styles.boxChecked]} />
            <View style={styles.text}>
              <Text style={done ? styles.titleDone : styles.title}>{task.title}</Text>
              <Text style={styles.meta}>
                {task.dueAt ? `Due ${formatDateTime(task.dueAt, timeZone)}` : 'No due date'}
                {task.notes ? ` · ${task.notes}` : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  empty: { color: '#6b7280' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  box: { width: 18, height: 18, marginTop: 2, borderRadius: 4, borderWidth: 1.5, borderColor: '#9ca3af' },
  boxChecked: { backgroundColor: '#111827', borderColor: '#111827' },
  text: { flex: 1 },
  title: { color: '#111827' },
  titleDone: { color: '#9ca3af', textDecorationLine: 'line-through' },
  meta: { color: '#6b7280', fontSize: 12, marginTop: 2 },
});
