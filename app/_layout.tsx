import { Stack } from 'expo-router';
import { VialProvider } from '../context/VialContext';

export default function RootLayout() {
  return (
    <VialProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </VialProvider>
  );
}