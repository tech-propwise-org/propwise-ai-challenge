import { StyleSheet, Text } from 'react-native';
import type { LeadStatus } from '../lib/api';

const COLORS: Record<LeadStatus, { background: string; text: string }> = {
  new: { background: '#dbeafe', text: '#1e40af' },
  contacted: { background: '#f1f5f9', text: '#1e293b' },
  qualified: { background: '#ede9fe', text: '#5b21b6' },
  viewing: { background: '#fef3c7', text: '#92400e' },
  negotiating: { background: '#ffedd5', text: '#9a3412' },
  won: { background: '#dcfce7', text: '#166534' },
  lost: { background: '#e5e7eb', text: '#4b5563' },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const color = COLORS[status];
  return <Text style={[styles.badge, { backgroundColor: color.background, color: color.text }]}>{status}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: '600',
  },
});
