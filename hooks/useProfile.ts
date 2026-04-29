import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type Profile = {
  id: string
  name: string
  age?: number | null
  height_cm?: number | null
  bio?: string | null
  favorite_exercise?: string | null
  gym_name?: string | null
  gym_id?: string | null
  instagram?: string | null
  avatar_url?: string | null
  show_me?: boolean | null
  city?: string | null
  checked_in_gym_id?: string | null
  checked_in_at?: string | null
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // PGRST116 = ingen rad funnet (ikke en feil)
      if (error && error.code !== 'PGRST116') throw error
      setProfile(data ?? null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, loading, error, refetch: fetchProfile }
}
