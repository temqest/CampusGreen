import { Stack } from 'expo-router';
import { ItemsProvider } from '@/context/items-context';
import { ThemeProvider } from '@/context/theme-context';
import { ChatProvider } from '@/context/chat-context';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ItemsProvider>
        <ChatProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="item/[id]" />
            <Stack.Screen name="payment/[id]" />
            <Stack.Screen name="meetup-zones" />
            <Stack.Screen name="chat/[id]" />
          </Stack>
        </ChatProvider>
      </ItemsProvider>
    </ThemeProvider>
  );
}
