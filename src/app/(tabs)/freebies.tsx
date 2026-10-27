import { StyleSheet, Text, View } from 'react-native';

export default function FreebiesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Freebie Corner / Pay-It-Forward</Text>
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
