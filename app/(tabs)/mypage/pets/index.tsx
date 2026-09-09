import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';
import { getPetListName, getPetsList, type PetSex } from '@/shared/api/petApi';

function GenderIcon({ sex }: { sex: PetSex }) {
  if (sex === 'NEUTER') return null;
  return (
    <Ionicons name={sex === 'FEMALE' ? 'female' : 'male'} size={14} color={sex === 'FEMALE' ? '#ec4899' : '#3b82f6'} />
  );
}

function speciesLabel(species: 'CANINE' | 'FELINE') {
  return species === 'CANINE' ? '강아지' : '고양이';
}

export default function PetListScreen() {
  const petsQuery = useQuery({ queryKey: ['pets', 'list'], queryFn: () => getPetsList(0, 10) });
  const pets = petsQuery.data?.pets ?? [];

  if (petsQuery.isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="paw-outline" size={40} color={DodoColors.fenceIdleLabel} />
        <Text style={styles.emptyText}>아직 등록된 반려동물이 없어요.</Text>
        <Link href="/(tabs)/mypage/pets/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>반려동물 추가하기</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>PET LIST</Text>
          <Text style={styles.title}>반려동물 리스트</Text>
        </View>
        <View style={styles.topRowRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>총 {pets.length}마리</Text>
          </View>
          <Link href="/(tabs)/mypage/pets/new" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>추가하기</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      {pets.map((pet) => (
        <View key={pet.petId} style={styles.petCard}>
          <View style={styles.petAvatar}>
            <Ionicons name="paw" size={24} color={DodoColors.brandForeground} />
          </View>
          <View style={styles.petInfo}>
            <View style={styles.petNameRow}>
              <Text style={styles.petName}>{getPetListName(pet)}</Text>
              <GenderIcon sex={pet.sex} />
            </View>
            <Text style={styles.petMeta}>만 {pet.age}세</Text>
            <Text style={styles.petMeta}>
              {speciesLabel(pet.species)} {pet.breed}
            </Text>
          </View>
          <View style={styles.petActions}>
            <Link href={{ pathname: '/(tabs)/mypage/pets/[petId]', params: { petId: String(pet.petId) } }} asChild>
              <TouchableOpacity style={styles.petActionButton}>
                <Text style={styles.petActionText}>상세 정보</Text>
              </TouchableOpacity>
            </Link>
            <Link
              href={{ pathname: '/(tabs)/mypage/pets/[petId]/weight', params: { petId: String(pet.petId) } }}
              asChild
            >
              <TouchableOpacity style={styles.petActionButton}>
                <Text style={styles.petActionText}>체중 관리</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      ))}
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
    marginBottom: 4,
  },
  topRowRight: {
    alignItems: 'flex-end',
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
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: DodoColors.surface,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  countBadgeText: {
    fontSize: 11,
    color: DodoColors.textSecondary,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: DodoColors.brand,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  petCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    padding: 14,
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    flex: 1,
    gap: 3,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  petName: {
    fontSize: 15,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  petMeta: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  petActions: {
    justifyContent: 'center',
    gap: 6,
  },
  petActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  petActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
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
  },
});
