import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '../lib/session';

export default function RootLayout() {
  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign in', headerBackVisible: false }} />
        <Stack.Screen name="leads/index" options={{ title: 'Leads', headerBackVisible: false }} />
        <Stack.Screen name="leads/[id]" options={{ title: 'Lead' }} />
      </Stack>
    </SessionProvider>
  );
}
