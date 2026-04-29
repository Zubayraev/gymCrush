import React, { useRef } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native'
import { Profile } from '../hooks/useProfile'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25

interface Props {
  profile: Profile
  onSwipeLeft: () => void
  onSwipeRight: () => void
  isTop: boolean
  stackIndex: number
}

const PLACEHOLDER = 'https://ui-avatars.com/api/?background=FF6B6B&color=fff&size=400'

export default function SwipeCard({ profile, onSwipeLeft, onSwipeRight, isTop, stackIndex }: Props) {
  const pan = useRef(new Animated.ValueXY()).current

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder: () => isTop,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, { dx, dy }) => {
        if (dx > SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: { x: SCREEN_WIDTH + 100, y: dy },
            duration: 250,
            useNativeDriver: false,
          }).start(onSwipeRight)
        } else if (dx < -SWIPE_THRESHOLD) {
          Animated.timing(pan, {
            toValue: { x: -SCREEN_WIDTH - 100, y: dy },
            duration: 250,
            useNativeDriver: false,
          }).start(onSwipeLeft)
        } else {
          // Snap tilbake til midten
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 80,
            useNativeDriver: false,
          }).start()
        }
      },
    })
  ).current

  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  })

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  const nopeOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const scale = isTop ? 1 : 1 - stackIndex * 0.04
  const translateY = isTop ? 0 : stackIndex * 10

  const avatarUri = profile.avatar_url
    ? profile.avatar_url
    : `${PLACEHOLDER}&name=${encodeURIComponent(profile.name ?? '?')}`

  return (
    <Animated.View
      {...(isTop ? panResponder.panHandlers : {})}
      style={[
        styles.card,
        {
          transform: isTop
            ? [{ translateX: pan.x }, { translateY: pan.y }, { rotate }]
            : [{ scale }, { translateY }],
          zIndex: 10 - stackIndex,
        },
      ]}
    >
      <Image source={{ uri: avatarUri }} style={styles.image} />

      {/* LIKE badge */}
      <Animated.View style={[styles.badge, styles.likeBadge, { opacity: likeOpacity }]}>
        <Text style={styles.likeText}>LIKE ♥</Text>
      </Animated.View>

      {/* NOPE badge */}
      <Animated.View style={[styles.badge, styles.nopeBadge, { opacity: nopeOpacity }]}>
        <Text style={styles.nopeText}>NOPE ✕</Text>
      </Animated.View>

      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.name}>
          {profile.name}, {profile.age}
        </Text>
        {profile.gym_name ? (
          <Text style={styles.meta}>🏋️ {profile.gym_name}</Text>
        ) : null}
        {profile.favorite_exercise ? (
          <Text style={styles.meta}>⚡ {profile.favorite_exercise}</Text>
        ) : null}
        {profile.bio ? (
          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: 48,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeBadge: {
    left: 24,
    borderColor: '#34C759',
    transform: [{ rotate: '-15deg' }],
  },
  nopeBadge: {
    right: 24,
    borderColor: '#FF6B6B',
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    color: '#34C759',
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 1,
  },
  nopeText: {
    color: '#FF6B6B',
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 1,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  meta: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
})
