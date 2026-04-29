import { useEffect } from 'react'
import { Stack, useRouter, useRootNavigationState, useSegments } from 'expo-router'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { View, ActivityIndicator } from 'react-native'

export default function RootLayout() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const router = useRouter()
  const rootNavState = useRootNavigationState()
  const segments = useSegments()

  useEffect(() => {
    if (!rootNavState?.key) return
    if (authLoading || (user && profileLoading)) return

    const inTabs = segments[0] === '(tabs)'
    const inAuth = segments[0] === '(auth)'

    if (!user) {
      // Innlogget bruker logget ut → tilbake til velkomst
      if (inTabs) router.replace('/')
      return
    }

    if (!profile) {
      // Innlogget, mangler profil → profiloppsett
      if (!inAuth) router.replace('/(auth)/setup-profile')
      return
    }

    // Innlogget med profil → send til tabs første gang (ikke mens man allerede er i tabs)
    if (!inTabs) {
      router.replace('/(tabs)/discover')
    }
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
