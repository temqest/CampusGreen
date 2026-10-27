import { Link, useRouter } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Button
        title="Sign In (Go to Marketplace)"
        onPress={() => router.replace('/(tabs)/marketplace')}
      />
      <View style={styles.links}>
        <Link href="/(auth)/register" style={styles.link}>
          Register
        </Link>
        <Link href="/(auth)/verify" style={styles.link}>
          Verification
        </Link>
        <Link href="/(auth)/forgot-password" style={styles.link}>
          Forgot Password
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
