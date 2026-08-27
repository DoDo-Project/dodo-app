import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

import { MOCK_NOTES, MOCK_PETS, MOCK_WEIGHT_RECORDS } from '../_mock';

export default function PetDetailScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const pet = MOCK_PETS.find((p) => p.id === petId) ?? MOCK_PETS[0];
  const weightRecords = MOCK_WEIGHT_RECORDS[pet.id] ?? [];
  const latestWeight = weightRecords[0];
  const notes = MOCK_NOTES[pet.id] ?? [];

  const handleLeaveFamily = () => {
    Alert.alert('가족 나가기', `${pet.name}의 가족에서 나가시겠어요?`, [
      { text: '취소', style: 'cancel' },
      { text: '나가기', style: 'destructive' },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>PET DETAIL</Text>
          <Text style={styles.title}>반려동물 상세정보</Text>
        </View>
        <View style={styles.topRowActions}>
          <TouchableOpacity style={styles.outlineButton} onPress={() => router.back()}>
            <Text style={styles.outlineButtonText}>목록으로</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>정보 수정</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.petHeaderRow}>
          <View style={styles.petAvatar}>
            <Ionicons name="paw" size={26} color={DodoColors.brandForeground} />
          </View>
          <View style={styles.petHeaderTextCol}>
            <View style={styles.petNameRow}>
              <Text style={styles.petName}>{pet.name}</Text>
              {pet.gender && (
                <Ionicons
                  name={pet.gender === 'F' ? 'female' : 'male'}
                  size={16}
                  color={pet.gender === 'F' ? '#ec4899' : '#3b82f6'}
                />
              )}
            </View>
            <Text style={styles.petMeta}>
              {pet.birthDate} ({pet.ageLabel})
            </Text>
            <Text style={styles.petMeta}>
              {pet.species} {pet.breed}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>기본 정보</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>동물등록번호</Text>
          <Text style={styles.infoValue}>{pet.registrationNumber ?? '미등록'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>디바이스 ID</Text>
          <Text style={styles.infoValue}>{pet.deviceId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>기준 심박수</Text>
          <Text style={styles.infoValue}>{pet.baselineHeartRate}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.infoLabel}>체중 정보</Text>
          <Link href={{ pathname: '/(tabs)/mypage/pets/[petId]/weight', params: { petId: pet.id } }} asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>전체보기</Text>
            </TouchableOpacity>
          </Link>
        </View>
        {latestWeight ? (
          <View style={styles.weightRow}>
            <Text style={styles.weightValue}>{latestWeight.weightKg}kg</Text>
            <Text style={styles.weightDate}>최근 측정일 {latestWeight.measuredAt}</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>등록된 체중 기록이 없어요.</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.infoLabel}>가족 구성원</Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>전체보기</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.familyRow}>
          <View style={styles.familyAvatar}>
            <Ionicons name="person" size={16} color={DodoColors.brandForeground} />
          </View>
          <Text style={styles.emptyText}>가족 구성원 1명과 함께 관리 중이에요.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>최근 활동</Text>
        <Text style={styles.emptyText}>최근 활동 정보가 없습니다.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.infoLabel}>특이사항</Text>
          <Link href={{ pathname: '/(tabs)/mypage/pets/[petId]/notes', params: { petId: pet.id } }} asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>전체보기</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <Text style={styles.notesSummary}>총 {notes.length}개의 특이사항이 등록되어 있어요.</Text>
        {notes.slice(0, 3).map((note) => (
          <View key={note.id} style={styles.noteRow}>
            <View style={styles.noteTag}>
              <Text style={styles.noteTagText}>{note.tag}</Text>
            </View>
            <Text style={styles.noteDate}>{note.date}</Text>
            <Text style={styles.noteContent} numberOfLines={1}>
              {note.content}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>펫 가족 나가기</Text>
        <Text style={styles.leaveHint}>
          가족에서 나가면 이 반려동물의 가족 구성원 목록과 관련 활동 기록을 더 이상 확인할 수 없어요. 다시 참여하려면
          초대 코드를 다시 등록해야 해요.
        </Text>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveFamily}>
          <Text style={styles.leaveButtonText}>가족 나가기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  topRowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.brand,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  outlineButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  outlineButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
    gap: 10,
  },
  petHeaderRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petHeaderTextCol: {
    gap: 3,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  petName: {
    fontSize: 17,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  petMeta: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.brand,
    letterSpacing: 0.3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoKey: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weightValue: {
    fontSize: 22,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  weightDate: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  familyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  notesSummary: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: DodoColors.background,
  },
  noteTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: DodoColors.textSecondary,
  },
  noteDate: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  noteContent: {
    flex: 1,
    fontSize: 12,
    color: DodoColors.textPrimary,
  },
  leaveHint: {
    fontSize: 11,
    lineHeight: 16,
    color: DodoColors.fenceIdleLabel,
  },
  leaveButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.fenceOutside,
  },
  leaveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.fenceOutside,
  },
});
