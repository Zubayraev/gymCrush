import { supabase } from './supabase'
import { Profile } from '../hooks/useProfile'

export async function swipeOnUser(
  swiperId: string,
  swipedId: string,
  liked: boolean
): Promise<{ isMatch: boolean }> {
  // Lagre swipe
  const { error: swipeError } = await supabase
    .from('swipes')
    .upsert({ swiper_id: swiperId, swiped_id: swipedId, liked })

  if (swipeError) throw swipeError
  if (!liked) return { isMatch: false }

  // Sjekk om den andre personen allerede har likt oss
  const { data: mutualLike } = await supabase
    .from('swipes')
    .select('id')
    .eq('swiper_id', swipedId)
    .eq('swiped_id', swiperId)
    .eq('liked', true)
    .maybeSingle()

  if (mutualLike) {
    // Gjensidig like → opprett match
    const { error: matchError } = await supabase
      .from('matches')
      .insert({ user1_id: swiperId, user2_id: swipedId })

    // Ignorer "unique violation" feil siden matchen kan eksistere allerede
    if (matchError && matchError.code !== '23505') throw matchError
    return { isMatch: true }
  }

  return { isMatch: false }
}

export async function getDiscoverProfiles(
  currentUserId: string,
  checkedInGymId: string
): Promise<Profile[]> {
  const { data: swipedRows } = await supabase
    .from('swipes')
    .select('swiped_id')
    .eq('swiper_id', currentUserId)

  const swipedIds = swipedRows?.map((r) => r.swiped_id) ?? []

  // Vis kun profiler som er sjekket inn på samme gym akkurat nå (ikke utløpt)
  const expiryThreshold = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()

  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId)
    .eq('checked_in_gym_id', checkedInGymId)
    .gte('checked_in_at', expiryThreshold)
    .neq('show_me', false)
    .limit(20)

  if (swipedIds.length > 0) {
    query = query.not('id', 'in', `(${swipedIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function getMatches(userId: string): Promise<Profile[]> {
  // Hent alle matcher der brukeren er involvert
  const { data: matchRows, error } = await supabase
    .from('matches')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

  if (error) throw error
  if (!matchRows || matchRows.length === 0) return []

  const matchedIds = matchRows.map((m) =>
    m.user1_id === userId ? m.user2_id : m.user1_id
  )

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', matchedIds)

  if (profileError) throw profileError
  return (profiles ?? []) as Profile[]
}
