import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Feil', 'Fyll inn e-post og passord')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      // Navigering håndteres av _layout.tsx basert på auth-state
    } catch (e: any) {
      Alert.alert('Innlogging feilet', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Tilbake</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Logg inn</Text>
        <Text style={styles.subtitle}>Velkommen tilbake! 💪</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-post</Text>
            <TextInput
              style={styles.input}
              placeholder="din@epost.no"
              placeholderTextColor="#AEAEB2"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Passord</Text>
            <TextInput
              style={styles.input}
              placeholder="Ditt passord"
              placeholderTextColor="#AEAEB2"
              secureTextEntry
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Logg inn</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.switchText}>
            Har du ikke konto?{' '}
            <Text style={styles.switchLink}>Registrer deg</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backBtn: {
    marginTop: 56,
    marginLeft: 20,
    padding: 4,
  },
  backText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#6C6C6E',
    marginTop: 6,
    marginBottom: 36,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  submitBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  switchText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#6C6C6E',
  },
  switchLink: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
})
