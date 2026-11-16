import { Link, Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '../../components/StatusBadge';
import { api, ApiError, LeadSummary } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useSession } from '../../lib/session';

const PAGE_SIZE = 20;

export default function LeadsScreen() {
  const { session, logout } = useSession();
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (offset: number) => {
      if (!session) return;
      setLoading(true);
      setError(null);
      try {
        const page = await api.listLeads(session.token, { limit: PAGE_SIZE, offset });
        setLeads((current) => (offset === 0 ? page.items : [...current, ...page.items]));
        setTotal(page.total);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return logout();
        setError(err instanceof Error ? err.message : 'Could not load leads');
      } finally {
        setLoading(false);
      }
    },
    [session, logout],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  if (!session) return <Redirect href="/login" />;
  const timeZone = session.agent.timezone;

  return (
    <FlatList
      style={styles.list}
      data={leads}
      keyExtractor={(lead) => lead.id}
      refreshControl={<RefreshControl refreshing={loading && leads.length > 0} onRefresh={() => load(0)} />}
      onEndReached={() => {
        if (!loading && leads.length < total) void load(leads.length);
      }}
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      ListEmptyComponent={
        loading ? <ActivityIndicator style={styles.spinner} /> : <Text style={styles.empty}>No leads yet.</Text>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item: lead }) => (
        <Link href={{ pathname: '/leads/[id]', params: { id: lead.id } }} asChild>
          <Pressable style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.name} numberOfLines={1}>
                {lead.name}
              </Text>
              <StatusBadge status={lead.status} />
              <Text style={styles.time}>{formatDateTime(lead.updatedAt, timeZone)}</Text>
            </View>
            {lead.lastMessage && (
              <Text style={styles.preview} numberOfLines={1}>
                {lead.lastMessage.direction === 'outbound' ? 'You: ' : ''}
                {lead.lastMessage.body}
              </Text>
            )}
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#ffffff' },
  row: { paddingHorizontal: 16, paddingVertical: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontWeight: '600', fontSize: 16, color: '#111827' },
  time: { marginLeft: 'auto', color: '#6b7280', fontSize: 12 },
  preview: { marginTop: 4, color: '#4b5563' },
  separator: { height: 1, backgroundColor: '#e5e7eb' },
  error: { color: '#dc2626', padding: 16 },
  empty: { color: '#6b7280', padding: 16 },
  spinner: { marginTop: 24 },
});
