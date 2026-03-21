import { Tabs } from 'expo-router';
import { Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useColorScheme() ?? 'light';
  const c = colors[theme]; // Get active colors

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          height: 65 + insets.bottom, 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10, 
          paddingTop: 10,
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.border,
        },
        tabBarLabelStyle: { fontSize: 13, fontWeight: 'bold' }
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ focused }) => (<Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>📅</Text>) }} />
      <Tabs.Screen name="vials" options={{ title: 'Vials', tabBarIcon: ({ focused }) => (<Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>💉</Text>) }} />
      <Tabs.Screen name="add" options={{ title: 'Add', tabBarIcon: ({ focused }) => (<Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>➕</Text>) }} />
      <Tabs.Screen name="inactive" options={{ title: 'Inactive', tabBarIcon: ({ focused }) => (<Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>⏸️</Text>) }} />
    </Tabs>
  );
}