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
import { Profile } from '../../hooks/useProfile'


export default function Discover() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [filterGym, setFilterGym] = useState(false)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const matchScale = useRef(new Animated.Value(0)).current

  const loadProfiles = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const gymFilter = filterGym && profile?.gym_name ? profile.gym_name : undefined
      const data = await getDiscoverProfiles(user.id, gymFilter)
      setProfiles(data)
    } catch (e: any) {
      Alert.alert('Feil', 'Kunne ikke laste profiler: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [user, filterGym, profile?.gym_name])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const handleSwipe = async (swipedProfile: Profile, liked: boolean) => {
    if (!user) return

    // Fjern kortet fra stabelen umiddelbart
    setProfiles((prev) => prev.filter((p) => p.id !== swipedProfile.id))

    try {
      const { isMatch } = await swipeOnUser(user.id, swipedProfile.id, liked)
      if (isMatch) {
        setMatchedProfile(swipedProfile)
        setShowMatch(true)
        // Animer match-modal
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

    // Last inn flere profiler når stabelen er lav
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
        <View style={styles.filterToggle}>
          <TouchableOpacity
            style={[styles.filterBtn, !filterGym && styles.filterBtnActive]}
            onPress={() => setFilterGym(false)}
          >
            <Text style={[styles.filterText, !filterGym && styles.filterTextActive]}>
              Alle
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterGym && styles.filterBtnActive]}
            onPress={() => setFilterGym(true)}
          >
            <Text style={[styles.filterText, filterGym && styles.filterTextActive]}>
              Mitt gym
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Kortstabler */}
      <View style={styles.cardContainer}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        ) : topProfiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyTitle}>Ingen flere profiler</Text>
            <Text style={styles.emptyText}>
              {filterGym
                ? 'Ingen andre fra ditt gym akkurat nå'
                : 'Du har sett alle tilgjengelige profiler'}
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

      {/* Handling-knapper */}
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
  filterToggle: {
    flexDirection: 'row',
    backgroundColor: '#EBEBEB',
    borderRadius: 10,
    padding: 3,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: '#F9F9F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#AEAEB2',
  },
  filterTextActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 60,
  },
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
  matchEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
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
