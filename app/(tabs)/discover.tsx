import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import SwipeCard from '../../components/SwipeCard'
import { getDiscoverProfiles, swipeOnUser } from '../../lib/matchingService'
import { checkInToGym, checkOutOfGym, isCheckInExpired, minutesRemainingForCheckIn } from '../../lib/checkIn'
import { GYM_LIST } from '../../components/GymPicker'
import { Profile } from '../../hooks/useProfile'

export default function Discover() {
  const { user } = useAuth()
  const { profile, refetch: refetchProfile } = useProfile(user?.id)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const matchScale = useRef(new Animated.Value(0)).current

  // Utled innsjekk-status fra profilen
  const checkedInGymId = profile?.checked_in_gym_id ?? null
  const checkedInAt = profile?.checked_in_at ?? null
  const isActiveCheckIn = !!checkedInGymId && !isCheckInExpired(checkedInAt)
  const checkedInGym = isActiveCheckIn
    ? GYM_LIST.find((g) => g.id === checkedInGymId) ?? null
    : null
  const minutesLeft = isActiveCheckIn && checkedInAt
    ? minutesRemainingForCheckIn(checkedInAt)
    : 0

  // Rydd utløpt innsjekk automatisk
  useEffect(() => {
    if (checkedInGymId && isCheckInExpired(checkedInAt) && user) {
      checkOutOfGym(user.id).then(() => refetchProfile())
    }
  }, [checkedInGymId, checkedInAt, user])

  const loadProfiles = useCallback(async () => {
    if (!user || !isActiveCheckIn || !checkedInGymId) return
    try {
      setLoading(true)
      const data = await getDiscoverProfiles(user.id, checkedInGymId)
      setProfiles(data)
    } catch (e: any) {
      Alert.alert('Feil', 'Kunne ikke laste profiler: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [user, isActiveCheckIn, checkedInGymId])

  useEffect(() => {
    if (isActiveCheckIn) {
      loadProfiles()
    } else {
      setProfiles([])
    }
  }, [isActiveCheckIn, loadProfiles])

  const handleCheckIn = async () => {
    if (!user) return

    if (!profile?.gym_id) {
      Alert.alert(
        'Inget treningssenter valgt',
        'Gå til Profil og velg ditt treningssenter først.'
      )
      return
    }

    setCheckingIn(true)
    try {
      const result = await checkInToGym(user.id)
      if (result.success) {
        await refetchProfile()
      } else if (result.reason === 'permission_denied') {
        Alert.alert(
          'Stedstillatelse nektet',
          'Aktiver stedstilgang for gymCrush i innstillingene for å sjekke inn.'
        )
      } else if (result.reason === 'not_at_gym') {
        Alert.alert(
          'Ikke på treningssenter',
          'Du ser ikke ut til å være på et registrert treningssenter. Du må være innenfor 150 meter.'
        )
      } else {
        Alert.alert('Feil', result.message ?? 'Kunne ikke sjekke inn')
      }
    } finally {
      setCheckingIn(false)
    }
  }

  const handleCheckOut = () => {
    Alert.alert('Sjekk ut', 'Er du sikker på at du vil sjekke ut?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Sjekk ut',
        style: 'destructive',
        onPress: async () => {
          if (!user) return
          await checkOutOfGym(user.id)
          await refetchProfile()
          setProfiles([])
        },
      },
    ])
  }

  const handleSwipe = async (swipedProfile: Profile, liked: boolean) => {
    if (!user) return
    setProfiles((prev) => prev.filter((p) => p.id !== swipedProfile.id))
    try {
      const { isMatch } = await swipeOnUser(user.id, swipedProfile.id, liked)
      if (isMatch) {
        setMatchedProfile(swipedProfile)
        setShowMatch(true)
        Animated.spring(matchScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }).start()
      }
    } catch (e: any) {
      console.error('Swipe-feil:', e.message)
    }
    if (profiles.length <= 2) {
      loadProfiles()
    }
  }

  const dismissMatch = () => {
    matchScale.setValue(0)
    setShowMatch(false)
    setMatchedProfile(null)
  }

  const topProfiles = profiles.slice(0, 3)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>gymCrush</Text>
        {isActiveCheckIn && (
          <TouchableOpacity style={styles.checkOutBtn} onPress={handleCheckOut}>
            <View style={styles.checkInDot} />
            <Text style={styles.checkOutText}>Sjekket inn</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Innsjekk-banner eller gym-badge */}
      {isActiveCheckIn ? (
        <View style={styles.checkedInBanner}>
          <Text style={styles.checkedInGym}>🏋️ {checkedInGym?.name ?? checkedInGymId}</Text>
          <Text style={styles.checkedInTimer}>{minutesLeft} min igjen</Text>
        </View>
      ) : (
        <View style={styles.checkInPrompt}>
          <Text style={styles.checkInPromptTitle}>Sjekk inn for å matche</Text>
          <Text style={styles.checkInPromptSub}>
            Du må være på treningssenteret for å se og matche med andre
          </Text>
          <TouchableOpacity
            style={[styles.checkInBtn, checkingIn && { opacity: 0.7 }]}
            onPress={handleCheckIn}
            disabled={checkingIn}
            activeOpacity={0.85}
          >
            {checkingIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkInBtnText}>📍 Sjekk inn nå</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Kortstabler */}
      {isActiveCheckIn && (
        <>
          <View style={styles.cardContainer}>
            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#FF6B6B" />
              </View>
            ) : topProfiles.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🏋️</Text>
                <Text style={styles.emptyTitle}>Ingen andre her nå</Text>
                <Text style={styles.emptyText}>
                  Ingen andre er sjekket inn på {checkedInGym?.name ?? 'ditt gym'} akkurat nå
                </Text>
                <TouchableOpacity style={styles.reloadBtn} onPress={loadProfiles}>
                  <Text style={styles.reloadText}>Oppdater</Text>
                </TouchableOpacity>
              </View>
            ) : (
              topProfiles
                .slice()
                .reverse()
                .map((p, reversedIndex) => {
                  const stackIndex = topProfiles.length - 1 - reversedIndex
                  return (
                    <SwipeCard
                      key={p.id}
                      profile={p}
                      isTop={stackIndex === 0}
                      stackIndex={stackIndex}
                      onSwipeLeft={() => handleSwipe(p, false)}
                      onSwipeRight={() => handleSwipe(p, true)}
                    />
                  )
                })
            )}
          </View>

          {!loading && topProfiles.length > 0 && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.nopeBtn]}
                onPress={() => handleSwipe(topProfiles[0], false)}
                activeOpacity={0.85}
              >
                <Text style={styles.nopeBtnText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.likeBtn]}
                onPress={() => handleSwipe(topProfiles[0], true)}
                activeOpacity={0.85}
              >
                <Text style={styles.likeBtnText}>♥</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Match-modal */}
      <Modal transparent visible={showMatch} animationType="fade">
        <View style={styles.matchOverlay}>
          <Animated.View
            style={[styles.matchCard, { transform: [{ scale: matchScale }] }]}
          >
            <Text style={styles.matchEmoji}>🎉</Text>
            <Text style={styles.matchTitle}>Det er en match!</Text>
            {matchedProfile && (
              <Text style={styles.matchName}>
                Du og {matchedProfile.name} liker hverandre
              </Text>
            )}
            <TouchableOpacity
              style={styles.matchBtn}
              onPress={dismissMatch}
              activeOpacity={0.85}
            >
              <Text style={styles.matchBtnText}>Fortsett å utforske</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF6B6B',
    letterSpacing: -0.5,
  },
  checkOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F9EE',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  checkInDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  checkOutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C7A3A',
  },
  checkedInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#E8F9EE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  checkedInGym: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C7A3A',
  },
  checkedInTimer: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '600',
  },
  checkInPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  checkInPromptTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  checkInPromptSub: {
    fontSize: 15,
    color: '#6C6C6E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  checkInBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 180,
    alignItems: 'center',
  },
  checkInBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  emptyText: {
    fontSize: 15,
    color: '#6C6C6E',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  reloadBtn: {
    marginTop: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reloadText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingVertical: 20,
    paddingBottom: 12,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nopeBtn: {
    backgroundColor: '#fff',
    shadowColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  likeBtn: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
  },
  nopeBtnText: {
    fontSize: 26,
    color: '#FF6B6B',
    fontWeight: '700',
  },
  likeBtnText: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '700',
  },
  matchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  matchEmoji: { fontSize: 64, marginBottom: 12 },
  matchTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  matchName: {
    fontSize: 16,
    color: '#6C6C6E',
    textAlign: 'center',
    marginBottom: 28,
  },
  matchBtn: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  matchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
