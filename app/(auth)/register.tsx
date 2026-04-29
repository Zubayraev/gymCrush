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
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../../lib/supabase'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Feil', 'Fyll inn alle feltene')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Feil', 'Passordene stemmer ikke overens')
      return
    }
    if (password.length < 6) {
      Alert.alert('Feil', 'Passordet må være minst 6 tegn')
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (error) throw error

      // Supabase krever e-postbekreftelse hvis det er aktivert i prosjektet
      if (data.session === null && data.user) {
        Alert.alert(
          'Sjekk e-posten din',
          'Vi har sendt en bekreftelseslenke til ' + email.trim() + '. Bekreft e-posten og logg inn.'
        )
        return
      }
      // Auth-state vil trigge navigering til setup-profile
    } catch (e: any) {
      const msg: string = e?.message ?? ''
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        Alert.alert('E-post er allerede i bruk', 'Prøv å logg inn i stedet.')
      } else {
        Alert.alert('Registrering feilet', msg || 'Ukjent feil – sjekk internettforbindelsen')
      }
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

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Opprett konto</Text>
        <Text style={styles.subtitle}>Bli en del av gymCrush 🔥</Text>

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
              placeholder="Minst 6 tegn"
              placeholderTextColor="#AEAEB2"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bekreft passord</Text>
            <TextInput
              style={styles.input}
              placeholder="Gjenta passordet"
              placeholderTextColor="#AEAEB2"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onSubmitEditing={handleRegister}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Registrer deg</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.switchText}>
            Har du allerede konto?{' '}
            <Text style={styles.switchLink}>Logg inn</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
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
