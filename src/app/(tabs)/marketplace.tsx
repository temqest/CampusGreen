import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function MarketplaceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Marketplace</Text>
      <View style={styles.links}>
        <Link
          href={{
            pathname: '/item/[id]',
            params: { id: '1' },
          }}
          style={styles.link}>
          View Sample Item (ID: 1)
        </Link>
        <Link href="/meetup-zones" style={styles.link}>
          View Safe Meetup Zones
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  links: {
    gap: 8,
    alignItems: 'center',
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
  },
});
