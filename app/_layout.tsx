import { Stack } from 'expo-router';
import { VialProvider } from '../context/VialContext';
import { ProtocolProvider } from '../context/ProtocolContext';

export default function RootLayout() {
  return (
    <VialProvider>
      <ProtocolProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ProtocolProvider>
    </VialProvider>
  );
}