import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '../../hooks/useAuth'
import MatchCard from '../../components/MatchCard'
import { getMatches } from '../../lib/matchingService'
import { Profile } from '../../hooks/useProfile'

export default function Matches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadMatches = useCallback(async () => {
    if (!user) return
    try {
      const data = await getMatches(user.id)
      setMatches(data)
    } catch (e: any) {
      Alert.alert('Feil', 'Kunne ikke laste matcher: ' + e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  const onRefresh = () => {
    setRefreshing(true)
    loadMatches()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Matcher</Text>
        {matches.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{matches.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💪</Text>
          <Text style={styles.emptyTitle}>Ingen matcher ennå</Text>
          <Text style={styles.emptyText}>
            Fortsett å utforske og finn din treningspartner!
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6B6B"
            />
          }
          renderItem={({ item }) => <MatchCard profile={item} />}
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
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
  },
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
})
