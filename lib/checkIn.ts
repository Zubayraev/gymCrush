import * as Location from 'expo-location'
import { supabase } from './supabase'

// Gymmens koordinater – juster om nødvendig etter eksakt adresse
const GYM_COORDS: Record<string, { lat: number; lon: number }> = {
  'sats-storo':            { lat: 59.9467, lon: 10.7754 },
  'sats-nydalen':          { lat: 59.9491, lon: 10.7682 },
  'sats-majorstuen':       { lat: 59.9247, lon: 10.7165 },
  'sats-toyen':            { lat: 59.9121, lon: 10.7665 },
  'sats-sentrum':          { lat: 59.9129, lon: 10.7463 },
  'sats-honefoss':         { lat: 60.1673, lon: 10.2547 },
  'sporty24-grunerlokka':  { lat: 59.9219, lon: 10.7596 },
  'sporty24-frogner':      { lat: 59.9225, lon: 10.7085 },
  'sporty24-honefoss':     { lat: 60.1680, lon: 10.2533 },
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
