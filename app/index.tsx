import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NÓS</Text>
      <Text style={styles.subtitle}>Um espaço só nosso.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#16151E',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#686578',
    marginTop: 8,
  },
});