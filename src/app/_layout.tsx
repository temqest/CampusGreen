import { Stack } from 'expo-router';
import { ItemsProvider } from '@/context/items-context';
import { ThemeProvider } from '@/context/theme-context';
import { ChatProvider } from '@/context/chat-context';
import { BasketProvider } from '@/context/basket-context';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ItemsProvider>
        <BasketProvider>
          <ChatProvider>
            <Stack screenOptions={{ headerShown: false, title: 'Campus Green' }}>
              <Stack.Screen name="index" options={{ title: 'Campus Green' }} />
              <Stack.Screen name="(auth)" options={{ title: 'Campus Green' }} />
              <Stack.Screen name="(tabs)" options={{ title: 'Campus Green' }} />
              <Stack.Screen name="item/[id]" />
              <Stack.Screen name="payment/[id]" />
              <Stack.Screen name="chat/[id]" />
            </Stack>
          </ChatProvider>
        </BasketProvider>
      </ItemsProvider>
    </ThemeProvider>
  );
}
