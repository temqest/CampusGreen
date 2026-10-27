import { Link, useRouter } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <Button
        title="Continue to Verification"
        onPress={() => router.push('/(auth)/verify')}
      />
      <Link href="/(auth)/login" style={styles.link}>
        Back to Login
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
