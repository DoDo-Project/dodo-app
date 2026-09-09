import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AvatarImagePicker } from '@/components/common/avatar-image-picker';
import { DatePickerModal } from '@/components/common/date-picker-modal';
import { DodoColors } from '@/constants/theme';
import { createPet } from '@/shared/api/petApi';

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

type Species = '강아지' | '고양이';
type Gender = '수컷' | '암컷';

const SPECIES_MAP: Record<Species, 'CANINE' | 'FELINE'> = { 강아지: 'CANINE', 고양이: 'FELINE' };
const GENDER_MAP: Record<Gender, 'MALE' | 'FEMALE'> = { 수컷: 'MALE', 암컷: 'FEMALE' };

function calculateAgeLabel(birthDate: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const birth = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return `만 ${Math.max(age, 0)}세`;
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

export default function NewPetScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [species, setSpecies] = useState<Species | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [baselineHeartRate, setBaselineHeartRate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const ageLabel = useMemo(() => calculateAgeLabel(birthDate), [birthDate]);

  const canSubmit =
    name.trim().length > 0 &&
    breed.trim().length > 0 &&
    !!species &&
    !!gender &&
    !!ageLabel &&
    deviceId.trim().length > 0 &&
    baselineHeartRate.trim().length > 0;

  const createMutation = useMutation({
    mutationFn: () => {
      const age = Number(ageLabel?.match(/\d+/)?.[0] ?? 0);
      return createPet({
        imageUrl: imageUrl ?? '',
        imageFileUrl: imageUrl ?? '',
        petName: name.trim(),
        species: SPECIES_MAP[species as Species],
        sex: GENDER_MAP[gender as Gender],
        breed: breed.trim(),
        birth: `${birthDate.trim()}T00:00:00`,
        age,
        registrationNumber: registrationNumber.trim() || undefined,
        referenceHeartRate: Number(baselineHeartRate),
        deviceId: deviceId.trim(),
      });
    },
    onSuccess: ({ petId }) => {
      queryClient.invalidateQueries({ queryKey: ['pets', 'list'] });
      router.replace({ pathname: '/(tabs)/mypage/pets/[petId]', params: { petId: String(petId) } });
    },
    onError: () => Alert.alert('오류', '반려동물을 등록하지 못했어요. 잠시 후 다시 시도해주세요.'),
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>새 반려동물 등록하기</Text>
        <Text style={styles.subtitle}>
          반려동물의 기본 정보와 디바이스 정보를 입력해 등록을 시작해보세요. 생년월일을 입력하면 만 나이는 자동으로
          계산돼요.
        </Text>

        <View style={styles.card}>
          <View style={styles.imageRow}>
            <AvatarImagePicker imageUrl={imageUrl} onUploaded={setImageUrl} size={72} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <Text style={styles.sectionHint}>이름, 종, 성별, 생년월일 같은 기본 프로필을 입력해 주세요.</Text>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>반려동물 이름 *</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 보리"
                placeholderTextColor={DodoColors.fenceIdleLabel}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>품종 *</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 말티즈"
                placeholderTextColor={DodoColors.fenceIdleLabel}
                value={breed}
                onChangeText={setBreed}
              />
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
                <Text style={birthDate ? styles.readonlyValue : styles.readonlyPlaceholder}>
                  {birthDate || '날짜 선택'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>만 나이</Text>
              <View style={styles.readonlyInput}>
                <Text style={ageLabel ? styles.readonlyValue : styles.readonlyPlaceholder}>
                  {ageLabel ?? '생년월일을 입력하면 자동 계산돼요.'}
                </Text>
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
          <Text style={styles.sectionHint}>디바이스 ID와 기준 심박수를 입력해 이후 기능과 연결할 수 있어요.</Text>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>디바이스 ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="예: ABC123XYZ"
                placeholderTextColor={DodoColors.fenceIdleLabel}
                value={deviceId}
                onChangeText={setDeviceId}
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>기준 심박수 *</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 85"
                placeholderTextColor={DodoColors.fenceIdleLabel}
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
          style={[styles.primaryButton, (!canSubmit || createMutation.isPending) && styles.primaryButtonDisabled]}
          disabled={!canSubmit || createMutation.isPending}
          onPress={() => createMutation.mutate()}
        >
          <Text style={styles.primaryButtonText}>{createMutation.isPending ? '등록 중...' : '등록하기'}</Text>
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
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    lineHeight: 18,
    marginTop: -8,
  },
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
    gap: 14,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 14,
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: DodoColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTextCol: {
    flex: 1,
    gap: 6,
  },
  imageBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  imageBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: DodoColors.textSecondary,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  imageHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    lineHeight: 16,
  },
  imageButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  imageButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  sectionHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    marginTop: -8,
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
  readonlyPlaceholder: {
    fontSize: 11,
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
