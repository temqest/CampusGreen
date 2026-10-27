import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item Details (ID: {id})</Text>
      <Link
        href={{
          pathname: '/chat/[id]',
          params: { id: id || '1' },
        }}
        style={styles.link}>
        Open Chat with Seller
      </Link>
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
  link: {
    color: '#007AFF',
    fontSize: 14,
  },
});
