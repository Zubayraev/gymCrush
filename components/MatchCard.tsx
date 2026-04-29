import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { Profile } from '../hooks/useProfile'

const PLACEHOLDER = 'https://ui-avatars.com/api/?background=FF6B6B&color=fff&size=200'

interface Props {
  profile: Profile
  onPress?: () => void
}

export default function MatchCard({ profile, onPress }: Props) {
  const avatarUri = profile.avatar_url
    ? profile.avatar_url
    : `${PLACEHOLDER}&name=${encodeURIComponent(profile.name ?? '?')}`

  const handleInstagram = () => {
    if (profile.instagram) {
      const handle = profile.instagram.replace('@', '')
      Linking.openURL(`https://instagram.com/${handle}`)
    }
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: avatarUri }} style={styles.avatar} />
      <View style={styles.overlay}>
        <Text style={styles.name} numberOfLines={1}>
          {profile.name}
        </Text>
        {profile.gym_name ? (
          <Text style={styles.gym} numberOfLines={1}>
            {profile.gym_name}
          </Text>
        ) : null}
      </View>
      {profile.instagram ? (
        <TouchableOpacity style={styles.igBtn} onPress={handleInstagram}>
          <Text style={styles.igText}>IG</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  name: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  gym: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  igBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,107,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  igText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
})
