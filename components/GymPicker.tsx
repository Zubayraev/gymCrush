import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native'

export type Gym = {
  id: string
  name: string
  city: string
  label: string
}

export const GYM_LIST: Gym[] = [
  { id: 'sats-storo', name: 'SATS Storo', city: 'Oslo', label: 'SATS Storo – Oslo' },
  { id: 'sats-nydalen', name: 'SATS Nydalen', city: 'Oslo', label: 'SATS Nydalen – Oslo' },
  { id: 'sats-bislett', name: 'SATS Bislett', city: 'Oslo', label: 'SATS Bislett – Oslo' },
  { id: 'sats-schous-plass', name: 'SATS Schous Plass', city: 'Oslo', label: 'SATS Schous Plass – Oslo' },
  { id: 'sats-sentrum', name: 'SATS Sentrum', city: 'Oslo', label: 'SATS Sentrum – Oslo' },
  { id: 'sats-honefoss', name: 'SATS Hønefoss', city: 'Hønefoss', label: 'SATS Hønefoss – Hønefoss' },
  { id: 'sporty24-honefoss', name: 'Sporty24 Hønefoss', city: 'Hønefoss', label: 'Sporty24 Hønefoss – Hønefoss' },
]

type Props = {
  visible: boolean
  selectedId: string | null
  onSelect: (gym: Gym) => void
  onClose: () => void
}

export default function GymPicker({ visible, selectedId, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')

  const filtered = GYM_LIST.filter((g) =>
    g.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Velg treningssenter</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Lukk</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Søk etter treningssenter..."
            placeholderTextColor="#AEAEB2"
            value={query}
            onChangeText={setQuery}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const selected = item.id === selectedId
            return (
              <TouchableOpacity
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => {
                  onSelect(item)
                  setQuery('')
                  onClose()
                }}
                activeOpacity={0.7}
              >
                <View style={styles.rowContent}>
                  <Text style={styles.gymIcon}>🏋️</Text>
                  <View>
                    <Text style={[styles.gymName, selected && styles.gymNameSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.gymCity}>{item.city}</Text>
                  </View>
                </View>
                {selected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Ingen treff for "{query}"</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F9F9F9',
  },
  rowSelected: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gymIcon: { fontSize: 22 },
  gymName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  gymNameSelected: { color: '#FF6B6B' },
  gymCity: { fontSize: 13, color: '#6C6C6E', marginTop: 2 },
  checkmark: { fontSize: 18, color: '#FF6B6B', fontWeight: '700' },
  empty: {
    textAlign: 'center',
    color: '#AEAEB2',
    fontSize: 15,
    marginTop: 40,
  },
})
