import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'

export default function Settings() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const router = useRouter()

  const [showMe, setShowMe] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (profile) {
      setShowMe(profile.show_me ?? true)
    }
  }, [profile])

  const toggleShowMe = async (value: boolean) => {
    setShowMe(value)
    if (!user) return
    await supabase
      .from('profiles')
      .update({ show_me: value })
      .eq('id', user.id)
  }

  const handleLogout = () => {
    Alert.alert(
      'Logg ut',
      'Er du sikker på at du vil logge ut?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Logg ut',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true)
              await supabase.auth.signOut()
              router.replace('/')
            } catch (e: any) {
              Alert.alert('Feil', e.message)
            } finally {
              setLoggingOut(false)
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Innstillinger</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Konto-seksjon */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>KONTO</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>E-post</Text>
              <Text style={styles.rowValue} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Oppdagelsesinnstillinger */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OPPDAGELSE</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Vis meg til andre</Text>
                <Text style={styles.rowDesc}>
                  Andre kan finne og like deg
                </Text>
              </View>
              <Switch
                value={showMe}
                onValueChange={toggleShowMe}
                trackColor={{ false: '#E5E5EA', true: '#FF6B6B' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Logg ut */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, loggingOut && { opacity: 0.7 }]}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.85}
          >
            {loggingOut ? (
              <ActivityIndicator color="#FF6B6B" />
            ) : (
              <Text style={styles.logoutText}>Logg ut</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>gymCrush v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#AEAEB2',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flex: 1, marginRight: 12 },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  rowValue: {
    fontSize: 15,
    color: '#6C6C6E',
    maxWidth: '55%',
  },
  rowDesc: {
    fontSize: 13,
    color: '#AEAEB2',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: '#AEAEB2',
    marginTop: 8,
  },
})
