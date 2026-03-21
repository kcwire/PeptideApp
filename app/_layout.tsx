import { Stack } from 'expo-router';
import { VialProvider } from './_context/VialContext';

export default function RootLayout() {
  return (
    <VialProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </VialProvider>
  );
}