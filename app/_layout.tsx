import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F0E17' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="screens/HomeScreen" />
      <Stack.Screen name="screens/LoginScreen" />
      <Stack.Screen name="screens/CoursesScreen" />
      <Stack.Screen name="screens/RollcallScreen" />
    </Stack>
  );
}
