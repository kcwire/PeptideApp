import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  // This grabs the exact dimensions of the phone's notches and gesture bars
  const insets = useSafeAreaInsets();

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          // Base height of 65 + whatever the phone needs for the gesture bar
          height: 65 + insets.bottom, 
          // Applies the exact padding needed, or defaults to 10 if the phone has physical buttons
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10, 
          paddingTop: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: 'bold',
        }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Today', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>📅</Text>
          ) 
        }} 
      />
      <Tabs.Screen 
        name="vials" 
        options={{ 
          title: 'Vials', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>💉</Text>
          ) 
        }} 
      />
      <Tabs.Screen 
        name="add" 
        options={{ 
          title: 'Add', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>➕</Text>
          ) 
        }} 
      />
      <Tabs.Screen 
        name="inactive" 
        options={{ 
          title: 'Inactive', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>⏸️</Text>
          ) 
        }} 
      />
    </Tabs>
  );
}