import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

import { MOCK_PETS } from '../pets/_mock';
import { MOCK_FAMILY_MEMBERS, MOCK_RECEIVED_REQUESTS } from './_mock';

function genderLabel(gender: 'F' | 'M' | null) {
  if (gender === 'F') return '암컷';
  if (gender === 'M') return '수컷';
  return '미상';
}

export default function FamilyScreen() {
  const [selectedPetId, setSelectedPetId] = useState(MOCK_PETS[0]?.id ?? '');
  const selectedPet = MOCK_PETS.find((p) => p.id === selectedPetId) ?? null;
  const members = selectedPet ? (MOCK_FAMILY_MEMBERS[selectedPet.id] ?? []) : [];

  if (MOCK_PETS.length === 0 || !selectedPet) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="paw-outline" size={40} color={DodoColors.fenceIdleLabel} />
        <Text style={styles.emptyText}>가족을 관리하려면 먼저 반려동물을 등록해주세요.</Text>
        <Link href="/(tabs)/mypage/pets/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>반려동물 추가하기</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  const handleCreateInviteCode = () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    Alert.alert('초대 코드 발급', `${selectedPet.name}의 초대 코드가 발급됐어요.\n\n${code}\n\n15분간 유효합니다.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>FAMILY</Text>
      <Text style={styles.title}>반려동물 가족 관리</Text>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>SELECT PET</Text>
        <Text style={styles.sectionHint}>가족을 관리할 반려동물을 선택해 주세요</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {MOCK_PETS.map((pet) => {
            const selected = pet.id === selectedPetId;
            return (
              <TouchableOpacity
                key={pet.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setSelectedPetId(pet.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{pet.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <View style={styles.petRow}>
          <View style={styles.petAvatar}>
            <Ionicons name="paw" size={24} color={DodoColors.brandForeground} />
          </View>
          <View style={styles.petTextCol}>
            <View style={styles.petNameRow}>
              <Text style={styles.petName}>{selectedPet.name}</Text>
              <View style={styles.familyCountBadge}>
                <Text style={styles.familyCountBadgeText}>가족 {members.length}명</Text>
              </View>
            </View>
            <Text style={styles.petMeta}>
              {selectedPet.birthDate} ({selectedPet.ageLabel})
            </Text>
            <Text style={styles.petMeta}>
              {selectedPet.species} {selectedPet.breed}
            </Text>
            <Text style={styles.petMeta}>성별 {genderLabel(selectedPet.gender)}</Text>
          </View>
          <Link href={{ pathname: '/(tabs)/mypage/pets/[petId]', params: { petId: selectedPet.id } }} asChild>
            <TouchableOpacity style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>상세정보</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>가족 구성원</Text>
        {members.map((member) => (
          <View key={member.id} style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Ionicons name="person" size={14} color={DodoColors.brandForeground} />
            </View>
            <Text style={styles.memberName}>{member.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardRow}>
        <View style={[styles.card, styles.cardHalf]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.infoLabel}>가족 신청</Text>
            <Link href="/(tabs)/mypage/family/apply" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>전체보기</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <Text style={styles.hintText}>새로운 가족을 만나보세요! 전체보기에서 확인할 수 있어요.</Text>
        </View>

        <View style={[styles.card, styles.cardHalf]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.infoLabel}>받은 신청 목록</Text>
            <Link href="/(tabs)/mypage/family/received" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>전체보기</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <Text style={styles.hintText}>
            {MOCK_RECEIVED_REQUESTS.length === 0
              ? '아직 받은 신청이 없어요.'
              : `${MOCK_RECEIVED_REQUESTS.length}건의 신청이 있어요.`}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>초대 코드 발급</Text>
        <Text style={styles.hintText}>
          선택한 반려동물 기준으로 초대 코드를 발급할 수 있어요.{'\n'}생성된 코드는 15분 동안 유효하고, 같은 코드로 가족
          신청을 받을 수 있어요.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateInviteCode}>
          <Text style={styles.primaryButtonText}>초대 코드 만들기</Text>
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
    marginBottom: 4,
  },
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 16,
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHalf: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.fenceIdleLabel,
    letterSpacing: 0.3,
  },
  sectionHint: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    marginTop: -4,
  },
  chipRow: {
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    marginRight: 8,
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
  petRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petTextCol: {
    flex: 1,
    gap: 2,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    fontSize: 15,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  familyCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#fdead9',
  },
  familyCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DodoColors.brand,
  },
  petMeta: {
    fontSize: 11,
    color: DodoColors.textSecondary,
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 13,
    color: DodoColors.textPrimary,
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
  hintText: {
    fontSize: 11,
    lineHeight: 16,
    color: DodoColors.fenceIdleLabel,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: DodoColors.brand,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyText: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
    textAlign: 'center',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: DodoColors.brand,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
});
