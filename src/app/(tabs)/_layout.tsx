import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="marketplace" options={{ title: 'Marketplace' }} />
      <Tabs.Screen name="swap" options={{ title: 'Swap' }} />
      <Tabs.Screen name="sell" options={{ title: 'Sell' }} />
      <Tabs.Screen name="freebies" options={{ title: 'Freebies' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
