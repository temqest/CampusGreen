import { StyleSheet, Text, View } from 'react-native';

export default function SwapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>The Swap Zone</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
