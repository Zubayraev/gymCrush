import { useEffect } from 'react'
import { Stack, useRouter, useRootNavigationState } from 'expo-router'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { View, ActivityIndicator } from 'react-native'

export default function RootLayout() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const router = useRouter()
  const rootNavState = useRootNavigationState()

  useEffect(() => {
    if (!rootNavState?.key) return
    if (authLoading || (user && profileLoading)) return

    // Ikke innlogget → ikke gjør noe, la velkomst/auth-skjermene styre
    if (!user) return

    // Innlogget, ingen profil → profil-oppsett
    if (!profile) {
      router.replace('/(auth)/setup-profile')
      return
    }

    // Innlogget med profil → hoved-appen
    router.replace('/(tabs)/discover')

  // Kjør kun når innloggingsstatus eller profil faktisk endres
  }, [rootNavState?.key, !!user, !!profile, authLoading, profileLoading])

  if (authLoading || (user && profileLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}
