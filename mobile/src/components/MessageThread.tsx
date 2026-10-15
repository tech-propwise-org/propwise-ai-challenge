import { StyleSheet, Text, View } from 'react-native';
import type { Message } from '../lib/api';
import { formatDateTime } from '../lib/format';

export function MessageThread({ messages, timeZone }: { messages: Message[]; timeZone: string }) {
  if (messages.length === 0) {
    return <Text style={styles.empty}>No messages yet.</Text>;
  }
  return (
    <View style={styles.list}>
      {messages.map((message) => {
        const inbound = message.direction === 'inbound';
        return (
          <View key={message.id} style={[styles.bubble, inbound ? styles.inbound : styles.outbound]}>
            <Text style={inbound ? styles.body : styles.bodyOutbound}>{message.body}</Text>
            <Text style={inbound ? styles.meta : styles.metaOutbound}>
              {inbound ? 'From lead' : 'You'} · {message.channel} · {formatDateTime(message.sentAt, timeZone)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  empty: { color: '#6b7280' },
  bubble: { maxWidth: '88%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  inbound: { alignSelf: 'flex-start', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb' },
  outbound: { alignSelf: 'flex-end', backgroundColor: '#111827' },
  body: { color: '#111827', fontSize: 15, writingDirection: 'auto' },
  bodyOutbound: { color: '#ffffff', fontSize: 15, writingDirection: 'auto' },
  meta: { marginTop: 4, color: '#6b7280', fontSize: 12 },
  metaOutbound: { marginTop: 4, color: '#d1d5db', fontSize: 12 },
});
