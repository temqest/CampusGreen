import { StyleSheet, Text, View } from 'react-native';

export default function MeetupZonesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safe Meetup Zones</Text>
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
