import { useRouter } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function VerifyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Verification</Text>
      <Button
        title="Complete Verification (Go to Marketplace)"
        onPress={() => router.replace('/(tabs)/marketplace')}
      />
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
});
