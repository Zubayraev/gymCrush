import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key)
  },
}

const supabaseUrl = 'https://bppzxeoipenuuhznlwtf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwcHp4ZW9pcGVudXVoem5sd3RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3OTc3MDUsImV4cCI6MjA5MjM3MzcwNX0.g4rSLAFgnZyU8RdVslJW2J63X8AE7HSAfW5_Goc3xrE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})