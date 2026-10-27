import { Stack } from 'expo-router';
import { ItemsProvider } from '@/context/items-context';

export default function RootLayout() {
  return (
    <ItemsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="payment/[id]" />
        <Stack.Screen name="meetup-zones" />
        <Stack.Screen name="chat/[id]" />
      </Stack>
    </ItemsProvider>
  );
}
