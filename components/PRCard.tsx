import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export type PR = {
  id: string
  exercise: string
  weight_kg: number
  reps: number
}

interface Props {
  pr: PR
  onDelete?: (id: string) => void
}

export default function PRCard({ pr, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.exercise}>{pr.exercise}</Text>
        <Text style={styles.detail}>
          {pr.weight_kg} kg × {pr.reps} reps
        </Text>
      </View>
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(pr.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  left: {
    flex: 1,
  },
  exercise: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  detail: {
    fontSize: 14,
    color: '#6C6C6E',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '700',
  },
})
