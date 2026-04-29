import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function Welcome() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Logo-område */}
      <View style={styles.heroContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🏋️</Text>
        </View>
        <Text style={styles.appName}>gymCrush</Text>
        <Text style={styles.tagline}>Finn din treningspartner</Text>
      </View>

      {/* Knapper */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Registrer deg</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Logg inn</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Ved å registrere deg godtar du våre vilkår
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  heroContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 44,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    color: '#6C6C6E',
    fontWeight: '400',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: '#AEAEB2',
    textAlign: 'center',
    marginTop: 16,
  },
})
