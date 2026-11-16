import { StyleSheet, Text, View } from 'react-native';
import type { LeadDetail } from '../lib/api';

/**
 * Placeholder for the AI assistant. See TASK.md: this is where the result the web app shows
 * (analysis, recommended properties, the follow-up waiting for approval) goes on mobile.
 */
export function AssistantPanel({ lead: _lead }: { lead: LeadDetail }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>AI assistant</Text>
      <Text style={styles.body}>Not built yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: { fontWeight: '600', fontSize: 16, color: '#111827' },
  body: { marginTop: 4, color: '#6b7280' },
});
