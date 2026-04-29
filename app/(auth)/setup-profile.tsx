import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import GymPicker, { Gym, GYM_LIST } from '../../components/GymPicker'

export default function SetupProfile() {
  const { user } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [bio, setBio] = useState('')
  const [favoriteExercise, setFavoriteExercise] = useState('')
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const [showGymPicker, setShowGymPicker] = useState(false)
  const [instagram, setInstagram] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Tillatelse nektet', 'Vi trenger tilgang til bildebiblioteket')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  const uploadAvatar = async (uri: string): Promise<string> => {
    setUploading(true)
    try {
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
      const filePath = `${user!.id}/avatar.jpeg`

      const response = await fetch(uri)
      const arrayBuffer = await response.arrayBuffer()

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: mimeType,
          upsert: true,
        })

      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      return `${data.publicUrl}?t=${Date.now()}`
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Mangler info', 'Navn er påkrevd')
      return
    }

    try {
      setLoading(true)

      // Hent fersk sesjon for å sikre gyldig JWT til Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        Alert.alert('Sesjon utløpt', 'Logg inn på nytt.')
        router.replace('/(auth)/login')
        return
      }
      const userId = session.user.id

      let avatarUrl = ''
      if (avatarUri) {
        avatarUrl = await uploadAvatar(avatarUri)
      }

      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        name: name.trim(),
        age: age ? parseInt(age, 10) : null,
        height_cm: height ? parseInt(height, 10) : null,
        bio: bio.trim(),
        favorite_exercise: favoriteExercise.trim(),
        gym_name: selectedGym?.name ?? null,
        gym_id: selectedGym?.id ?? null,
        city: selectedGym?.city ?? null,
        instagram: instagram.trim(),
        avatar_url: avatarUrl || null,
      })

      if (error) throw error
      router.replace('/(tabs)/discover')
    } catch (e: any) {
      Alert.alert('Feil', e.message)
    } finally {
      setLoading(false)
    }
  }

  const isLoading = loading || uploading

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />

      <Text style={styles.title}>Sett opp profilen din</Text>
      <Text style={styles.subtitle}>La andre gym-entusiaster bli kjent med deg</Text>

      {/* Profilbilde */}
      <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarIcon}>📷</Text>
            <Text style={styles.avatarHint}>Legg til bilde</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Skjemafelt */}
      <View style={styles.form}>
        <InputField label="Navn *" value={name} onChangeText={setName} placeholder="Ditt navn" />
        <View style={styles.row}>
          <View style={styles.halfField}>
            <InputField
              label="Alder"
              value={age}
              onChangeText={setAge}
              placeholder="25"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfField}>
            <InputField
              label="Høyde (cm)"
              value={height}
              onChangeText={setHeight}
              placeholder="175"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <InputField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Fortell litt om deg selv..."
          multiline
          numberOfLines={3}
        />
        <InputField
          label="Favorittøvelse"
          value={favoriteExercise}
          onChangeText={setFavoriteExercise}
          placeholder="Benkpress, knebøy..."
        />

        {/* Treningssenter-velger */}
        <View style={inputStyles.group}>
          <Text style={inputStyles.label}>Treningssenter</Text>
          <TouchableOpacity
            style={inputStyles.pickerBtn}
            onPress={() => setShowGymPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={selectedGym ? inputStyles.pickerValue : inputStyles.pickerPlaceholder}>
              {selectedGym ? `🏋️ ${selectedGym.name}` : 'Velg treningssenter...'}
            </Text>
            <Text style={inputStyles.pickerChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <InputField
          label="Instagram"
          value={instagram}
          onChangeText={setInstagram}
          placeholder="@brukernavn"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Lagre og fortsett →</Text>
        )}
      </TouchableOpacity>

      <GymPicker
        visible={showGymPicker}
        selectedId={selectedGym?.id ?? null}
        onSelect={(gym) => setSelectedGym(gym)}
        onClose={() => setShowGymPicker(false)}
      />
    </ScrollView>
  )
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType,
  autoCapitalize,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  multiline?: boolean
  numberOfLines?: number
  keyboardType?: any
  autoCapitalize?: any
}) {
  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={[inputStyles.input, multiline && inputStyles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#AEAEB2"
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
      />
    </View>
  )
}

const inputStyles = StyleSheet.create({
  group: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginLeft: 2 },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  multiline: {
    height: 90,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  pickerBtn: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerValue: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#AEAEB2',
  },
  pickerChevron: {
    fontSize: 22,
    color: '#AEAEB2',
    marginTop: -2,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C6C6E',
    marginTop: 6,
    marginBottom: 28,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
  },
  avatarIcon: { fontSize: 28 },
  avatarHint: { fontSize: 11, color: '#FF6B6B', marginTop: 4, fontWeight: '600' },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
})
