import { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import PRCard, { PR } from '../../components/PRCard'
import { supabase } from '../../lib/supabase'

const PLACEHOLDER = 'https://ui-avatars.com/api/?background=FF6B6B&color=fff&size=200'

export default function ProfileScreen() {
  const { user } = useAuth()
  const { profile, loading, refetch } = useProfile(user?.id)
  const [editing, setEditing] = useState(false)
  const [prs, setPrs] = useState<PR[]>([])
  const [prsLoaded, setPrsLoaded] = useState(false)
  const [showAddPR, setShowAddPR] = useState(false)
  const [newExercise, setNewExercise] = useState('')
  const [newWeight, setNewWeight] = useState('')
  const [newReps, setNewReps] = useState('')
  const [saving, setSaving] = useState(false)

  // Redigeringsfelt
  const [editName, setEditName] = useState('')
  const [editAge, setEditAge] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editGym, setEditGym] = useState('')
  const [editExercise, setEditExercise] = useState('')
  const [editInstagram, setEditInstagram] = useState('')
  const [editHeight, setEditHeight] = useState('')
  const [editCity, setEditCity] = useState('')

  // Treningssenter-seksjon
  const [gymInput, setGymInput] = useState('')
  const [editingGym, setEditingGym] = useState(false)
  const [savingGym, setSavingGym] = useState(false)

  const loadPRs = useCallback(async () => {
    if (!user || prsLoaded) return
    const { data } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
    setPrs((data as PR[]) ?? [])
    setPrsLoaded(true)
  }, [user, prsLoaded])

  // Last inn PR-er ved mount
  useEffect(() => {
    loadPRs()
  }, [loadPRs])

  const startEdit = () => {
    if (!profile) return
    setEditName(profile.name ?? '')
    setEditAge(profile.age ? String(profile.age) : '')
    setEditHeight(profile.height_cm ? String(profile.height_cm) : '')
    setEditBio(profile.bio ?? '')
    setEditGym(profile.gym_name ?? '')
    setEditExercise(profile.favorite_exercise ?? '')
    setEditInstagram(profile.instagram ?? '')
    setEditCity(profile.city ?? '')
    setEditing(true)
  }

  const saveProfile = async () => {
    if (!user) return
    try {
      setSaving(true)
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editName.trim(),
          age: editAge ? parseInt(editAge, 10) : null,
          height_cm: editHeight ? parseInt(editHeight, 10) : null,
          bio: editBio.trim(),
          gym_name: editGym.trim(),
          favorite_exercise: editExercise.trim(),
          instagram: editInstagram.trim(),
          city: editCity.trim(),
        })
        .eq('id', user.id)

      if (error) throw error
      await refetch()
      setEditing(false)
    } catch (e: any) {
      Alert.alert('Feil', e.message)
    } finally {
      setSaving(false)
    }
  }

  const updateAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (result.canceled || !result.assets[0] || !user) return

    try {
      setSaving(true)
      const uri = result.assets[0].uri
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
      const filePath = `${user.id}/avatar.jpeg`

      const response = await fetch(uri)
      const arrayBuffer = await response.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, { contentType: mimeType, upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      await supabase
        .from('profiles')
        .update({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
        .eq('id', user.id)

      await refetch()
    } catch (e: any) {
      Alert.alert('Feil ved opplasting', e.message)
    } finally {
      setSaving(false)
    }
  }

  const addPR = async () => {
    if (!newExercise.trim() || !newWeight || !user) {
      Alert.alert('Mangler info', 'Fyll inn øvelse og vekt')
      return
    }
    try {
      const { data, error } = await supabase
        .from('personal_records')
        .insert({
          user_id: user.id,
          exercise: newExercise.trim(),
          weight_kg: parseFloat(newWeight),
          reps: newReps ? parseInt(newReps, 10) : 1,
        })
        .select()
        .single()

      if (error) throw error
      setPrs((prev) => [data as PR, ...prev])
      setNewExercise('')
      setNewWeight('')
      setNewReps('')
      setShowAddPR(false)
    } catch (e: any) {
      Alert.alert('Feil', e.message)
    }
  }

  const deletePR = async (id: string) => {
    const { error } = await supabase.from('personal_records').delete().eq('id', id)
    if (!error) {
      setPrs((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const startEditGym = () => {
    setGymInput(profile?.gym_name ?? '')
    setEditingGym(true)
  }

  const saveGym = async () => {
    if (!user) return
    try {
      setSavingGym(true)
      const { error } = await supabase
        .from('profiles')
        .update({ gym_name: gymInput.trim() })
        .eq('id', user.id)
      if (error) throw error
      await refetch()
      setEditingGym(false)
    } catch (e: any) {
      Alert.alert('Feil', e.message)
    } finally {
      setSavingGym(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    )
  }

  const avatarUri = profile?.avatar_url
    ? profile.avatar_url
    : `${PLACEHOLDER}&name=${encodeURIComponent(profile?.name ?? '?')}`

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
          {!editing && (
            <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
              <Text style={styles.editBtnText}>Rediger</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profilkort */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={editing ? updateAvatar : undefined}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            {editing && (
              <View style={styles.avatarEditOverlay}>
                <Text style={styles.avatarEditText}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          {editing ? (
            <View style={styles.editForm}>
              <EditRow label="Navn" value={editName} onChange={setEditName} />
              <View style={styles.editRow}>
                <View style={{ flex: 1 }}>
                  <EditRow label="Alder" value={editAge} onChange={setEditAge} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <EditRow label="Høyde (cm)" value={editHeight} onChange={setEditHeight} keyboardType="number-pad" />
                </View>
              </View>
              <EditRow label="Bio" value={editBio} onChange={setEditBio} multiline />
              <EditRow label="Treningssenter" value={editGym} onChange={setEditGym} />
              <EditRow label="Favorittøvelse" value={editExercise} onChange={setEditExercise} />
              <EditRow label="Instagram" value={editInstagram} onChange={setEditInstagram} autoCapitalize="none" />
              <EditRow label="Bosted" value={editCity} onChange={setEditCity} />

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.cancelText}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                  onPress={saveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveText}>Lagre</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.name}{profile?.age ? `, ${profile.age}` : ''}
              </Text>
              {profile?.gym_name ? (
                <Text style={styles.profileMeta}>🏋️ {profile.gym_name}</Text>
              ) : null}
              {profile?.height_cm ? (
                <Text style={styles.profileMeta}>📏 {profile.height_cm} cm</Text>
              ) : null}
              {profile?.favorite_exercise ? (
                <Text style={styles.profileMeta}>⚡ {profile.favorite_exercise}</Text>
              ) : null}
              {profile?.instagram ? (
                <Text style={styles.profileMeta}>📸 {profile.instagram}</Text>
              ) : null}
              {profile?.city ? (
                <Text style={styles.profileMeta}>📍 {profile.city}</Text>
              ) : null}
              {profile?.bio ? (
                <Text style={styles.profileBio}>{profile.bio}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Treningssenter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Treningssenter</Text>
            {!editingGym && (
              <TouchableOpacity style={styles.addPRBtn} onPress={startEditGym}>
                <Text style={styles.addPRText}>
                  {profile?.gym_name ? 'Endre' : '+ Legg til'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {editingGym ? (
            <View style={styles.gymEditRow}>
              <TextInput
                style={styles.gymInput}
                value={gymInput}
                onChangeText={setGymInput}
                placeholder="SATS, Elixia, Evo..."
                placeholderTextColor="#AEAEB2"
                autoFocus
              />
              <TouchableOpacity
                style={styles.gymSaveBtn}
                onPress={saveGym}
                disabled={savingGym}
              >
                {savingGym
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.gymSaveBtnText}>Lagre</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gymCancelBtn}
                onPress={() => setEditingGym(false)}
              >
                <Text style={styles.gymCancelBtnText}>Avbryt</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={profile?.gym_name ? styles.gymValue : styles.emptyPR}>
              {profile?.gym_name ? `🏋️ ${profile.gym_name}` : 'Ingen treningssenter lagt til ennå'}
            </Text>
          )}
        </View>

        {/* Personlige rekorder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personlige rekorder</Text>
            <TouchableOpacity
              style={styles.addPRBtn}
              onPress={() => setShowAddPR(true)}
            >
              <Text style={styles.addPRText}>+ Legg til</Text>
            </TouchableOpacity>
          </View>

          {prs.length === 0 ? (
            <Text style={styles.emptyPR}>Ingen PR-er ennå. Legg til din første!</Text>
          ) : (
            prs.map((pr) => (
              <PRCard key={pr.id} pr={pr} onDelete={deletePR} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Legg til PR-modal */}
      <Modal transparent visible={showAddPR} animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ny personlig rekord</Text>

            <View style={styles.modalForm}>
              <TextInput
                style={styles.modalInput}
                placeholder="Øvelse (f.eks. Benkpress)"
                placeholderTextColor="#AEAEB2"
                value={newExercise}
                onChangeText={setNewExercise}
              />
              <View style={styles.modalRow}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="Vekt (kg)"
                  placeholderTextColor="#AEAEB2"
                  keyboardType="decimal-pad"
                  value={newWeight}
                  onChangeText={setNewWeight}
                />
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="Reps"
                  placeholderTextColor="#AEAEB2"
                  keyboardType="number-pad"
                  value={newReps}
                  onChangeText={setNewReps}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddPR(false)}
              >
                <Text style={styles.cancelText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addPR}>
                <Text style={styles.saveText}>Lagre PR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

function EditRow({
  label,
  value,
  onChange,
  multiline,
  keyboardType,
  autoCapitalize,
}: {
  label: string
  value: string
  onChange: (t: string) => void
  multiline?: boolean
  keyboardType?: any
  autoCapitalize?: any
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#6C6C6E' }}>{label}</Text>
      <TextInput
        style={[
          editRowStyles.input,
          multiline && editRowStyles.multiline,
        ]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        placeholderTextColor="#AEAEB2"
      />
    </View>
  )
}

const editRowStyles = StyleSheet.create({
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1C1C1E',
  },
  multiline: {
    height: 76,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  editBtn: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editBtnText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditText: { fontSize: 14 },
  profileInfo: { alignItems: 'center', gap: 6, width: '100%' },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  profileMeta: {
    fontSize: 15,
    color: '#6C6C6E',
  },
  profileBio: {
    fontSize: 14,
    color: '#6C6C6E',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  editForm: { width: '100%', gap: 14 },
  editRow: { flexDirection: 'row', gap: 12 },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  addPRBtn: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addPRText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyPR: {
    color: '#AEAEB2',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#1C1C1E',
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  modalForm: { gap: 12, marginBottom: 20 },
  modalInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  modalRow: { flexDirection: 'row', gap: 12 },
  modalActions: { flexDirection: 'row', gap: 12 },
  gymEditRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  gymInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1C1C1E',
  },
  gymSaveBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymSaveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  gymCancelBtn: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymCancelBtnText: {
    color: '#1C1C1E',
    fontWeight: '600',
    fontSize: 14,
  },
  gymValue: {
    fontSize: 15,
    color: '#1C1C1E',
    paddingVertical: 4,
  },
})
