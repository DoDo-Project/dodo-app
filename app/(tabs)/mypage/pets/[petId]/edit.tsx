import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { AvatarImagePicker } from '@/components/common/avatar-image-picker';
import { DatePickerModal } from '@/components/common/date-picker-modal';
import { DodoColors } from '@/constants/theme';
import { getPetDetail, updatePet } from '@/shared/api/petApi';

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

type Species = '강아지' | '고양이';
type Gender = '수컷' | '암컷';

const SPECIES_MAP: Record<Species, 'CANINE' | 'FELINE'> = { 강아지: 'CANINE', 고양이: 'FELINE' };
const SPECIES_REVERSE: Record<'CANINE' | 'FELINE', Species> = { CANINE: '강아지', FELINE: '고양이' };
const GENDER_MAP: Record<Gender, 'MALE' | 'FEMALE'> = { 수컷: 'MALE', 암컷: 'FEMALE' };
const GENDER_REVERSE: Record<'MALE' | 'FEMALE' | 'NEUTER', Gender> = { MALE: '수컷', FEMALE: '암컷', NEUTER: '수컷' };

function calculateAgeFromBirth(birthDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate.trim());
  if (!match) return 0;
  const [, y, m, d] = match;
  const birth = new Date(Number(y), Number(m) - 1, Number(d));
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return Math.max(age, 0);
}

function ChipSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function EditPetScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const petQuery = useQuery({ queryKey: ['pets', petId], queryFn: () => getPetDetail(petId), enabled: !!petId });

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [species, setSpecies] = useState<Species | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [baselineHeartRate, setBaselineHeartRate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    if (!petQuery.data) return;
    const pet = petQuery.data;
    setName(pet.petName);
    setBreed(pet.breed);
    setSpecies(SPECIES_REVERSE[pet.species]);
    setGender(GENDER_REVERSE[pet.sex]);
    setBirthDate(pet.birth?.slice(0, 10) ?? '');
    setRegistrationNumber(pet.registrationNumber ?? '');
    setDeviceId(pet.deviceId);
    setBaselineHeartRate(String(pet.referenceHeartRate));
    setImageUrl(pet.imageFileUrl ?? null);
  }, [petQuery.data]);

  const ageLabel = useMemo(() => (birthDate ? `만 ${calculateAgeFromBirth(birthDate)}세` : null), [birthDate]);

  const canSubmit =
    name.trim().length > 0 &&
    breed.trim().length > 0 &&
    !!species &&
    !!gender &&
    birthDate.trim().length > 0 &&
    deviceId.trim().length > 0 &&
    baselineHeartRate.trim().length > 0;

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!petQuery.data) throw new Error('not loaded');
      return updatePet(petId, {
        imageFileUrl: imageUrl ?? '',
        petName: name.trim(),
        species: SPECIES_MAP[species as Species],
        sex: GENDER_MAP[gender as Gender],
        breed: breed.trim(),
        birth: `${birthDate.trim()}T00:00:00`,
        age: calculateAgeFromBirth(birthDate),
        registrationNumber: registrationNumber.trim() || undefined,
        referenceHeartRate: Number(baselineHeartRate),
        deviceId: deviceId.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets', petId] });
      queryClient.invalidateQueries({ queryKey: ['pets', 'list'] });
      router.back();
    },
    onError: () => Alert.alert('오류', '반려동물 정보를 수정하지 못했어요.'),
  });

  if (petQuery.isLoading || !petQuery.data) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.imageRow}>
            <AvatarImagePicker imageUrl={imageUrl} onUploaded={setImageUrl} size={72} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>기본 정보</Text>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>반려동물 이름 *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>품종 *</Text>
              <TextInput style={styles.input} value={breed} onChangeText={setBreed} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>종 *</Text>
            <ChipSelect options={['강아지', '고양이'] as const} value={species} onChange={setSpecies} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>성별 *</Text>
            <ChipSelect options={['수컷', '암컷'] as const} value={gender} onChange={setGender} />
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>생년월일 *</Text>
              <TouchableOpacity style={styles.readonlyInput} onPress={() => setDatePickerVisible(true)}>
                <Text style={birthDate ? styles.readonlyValue : styles.placeholderValue}>
                  {birthDate || '날짜 선택'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>만 나이</Text>
              <View style={styles.readonlyInput}>
                <Text style={styles.readonlyValue}>{ageLabel ?? '-'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>등록번호</Text>
            <TextInput
              style={styles.input}
              placeholder="없다면 비워두셔도 괜찮아요"
              placeholderTextColor={DodoColors.fenceIdleLabel}
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>디바이스 및 건강 기준값</Text>
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>디바이스 ID *</Text>
              <TextInput style={styles.input} value={deviceId} onChangeText={setDeviceId} />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>기준 심박수 *</Text>
              <TextInput
                style={styles.input}
                value={baselineHeartRate}
                onChangeText={setBaselineHeartRate}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <Text style={styles.requiredHint}>* 표시는 필수 입력 항목입니다.</Text>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, (!canSubmit || updateMutation.isPending) && styles.primaryButtonDisabled]}
          disabled={!canSubmit || updateMutation.isPending}
          onPress={() => updateMutation.mutate()}
        >
          <Text style={styles.primaryButtonText}>{updateMutation.isPending ? '저장 중...' : '저장하기'}</Text>
        </TouchableOpacity>
      </View>

      <DatePickerModal
        visible={datePickerVisible}
        initialDate={birthDate}
        maxDate={todayString()}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={setBirthDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  imageRow: {
    alignItems: 'center',
  },
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
    gap: 6,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 12,
    fontSize: 13,
    color: DodoColors.textPrimary,
  },
  readonlyInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  readonlyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  placeholderValue: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
  },
  chipSelected: {
    borderColor: DodoColors.brand,
    backgroundColor: DodoColors.brand,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  chipTextSelected: {
    color: DodoColors.brandForeground,
  },
  requiredHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: DodoColors.border,
    backgroundColor: DodoColors.surface,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  primaryButton: {
    flex: 1.4,
    height: 44,
    borderRadius: 10,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
});
