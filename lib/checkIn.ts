import * as Location from 'expo-location'
import { supabase } from './supabase'

// Gymmens koordinater – verifisert mot offentlige adresseregistre
const GYM_COORDS: Record<string, { lat: number; lon: number }> = {
  'sats-storo':        { lat: 59.946890, lon: 10.772761 }, // Vitaminveien 5-7, 0485 Oslo
  'sats-nydalen':      { lat: 59.949100, lon: 10.768400 }, // Sandakerveien 109-111, 0484 Oslo
  'sats-bislett':      { lat: 59.924460, lon: 10.732214 }, // Bislettgata 6, 0167 Oslo
  'sats-schous-plass': { lat: 59.921900, lon: 10.759600 }, // Trondheimsveien 2D, 0560 Oslo
  'sats-sentrum':      { lat: 59.914899, lon: 10.742653 }, // Akersgata 51, 0180 Oslo
  'sats-honefoss':     { lat: 60.170000, lon: 10.258000 }, // Kartverksveien 2, 3511 Hønefoss
  'sporty24-honefoss': { lat: 60.180100, lon: 10.237700 }, // Arnemannsveien 5, 3510 Hønefoss
}

const CHECK_IN_RADIUS_M = 150
const CHECK_IN_DURATION_MS = 3 * 60 * 60 * 1000 // 3 timer

function haversineDistanceM(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export type CheckInResult =
  | { success: true; gymId: string }
  | { success: false; reason: 'permission_denied' | 'not_at_gym' | 'error'; message?: string }

export async function checkInToGym(userId: string): Promise<CheckInResult> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    return { success: false, reason: 'permission_denied' }
  }

  let position: Location.LocationObject
  try {
    position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
  } catch (e: any) {
    return { success: false, reason: 'error', message: e.message }
  }

  const { latitude, longitude } = position.coords

  // Finn gym innenfor radius
  let closestGymId: string | null = null
  let closestDist = Infinity

  for (const [gymId, coords] of Object.entries(GYM_COORDS)) {
    const dist = haversineDistanceM(latitude, longitude, coords.lat, coords.lon)
    if (dist < closestDist) {
      closestDist = dist
      closestGymId = gymId
    }
  }

  if (closestDist > CHECK_IN_RADIUS_M) {
    return { success: false, reason: 'not_at_gym' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      checked_in_gym_id: closestGymId,
      checked_in_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { success: false, reason: 'error', message: error.message }
  return { success: true, gymId: closestGymId! }
}

export async function checkOutOfGym(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ checked_in_gym_id: null, checked_in_at: null })
    .eq('id', userId)
}

export function isCheckInExpired(checkedInAt: string | null): boolean {
  if (!checkedInAt) return true
  return Date.now() - new Date(checkedInAt).getTime() > CHECK_IN_DURATION_MS
}

export function minutesRemainingForCheckIn(checkedInAt: string): number {
  const elapsed = Date.now() - new Date(checkedInAt).getTime()
  return Math.max(0, Math.ceil((CHECK_IN_DURATION_MS - elapsed) / 60000))
}
