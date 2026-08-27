import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Circle, Polyline, Svg } from 'react-native-svg';

import { DodoColors } from '@/constants/theme';

import { MOCK_PETS, MOCK_WEIGHT_RECORDS, type WeightRecord } from '../_mock';

const CHART_WIDTH = 300;
const CHART_HEIGHT = 140;
const CHART_PADDING = 20;

function WeightChart({ records }: { records: WeightRecord[] }) {
  const oldestFirst = [...records].reverse();
  const values = oldestFirst.map((r) => r.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = oldestFirst.map((record, index) => {
    const x = CHART_PADDING + (index * (CHART_WIDTH - CHART_PADDING * 2)) / Math.max(oldestFirst.length - 1, 1);
    const y = CHART_PADDING + (1 - (record.weightKg - min) / range) * (CHART_HEIGHT - CHART_PADDING * 2);
    return { x, y, record };
  });

  return (
    <View>
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Polyline
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={DodoColors.brand}
          strokeWidth={2}
        />
        {points.map((p) => (
          <Circle key={p.record.id} cx={p.x} cy={p.y} r={4} fill={DodoColors.brand} />
        ))}
      </Svg>
      <View style={styles.chartLabelsRow}>
        {oldestFirst.map((r) => (
          <Text key={r.id} style={styles.chartLabel}>
            {r.measuredAt.slice(5).replace('. ', '.')}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function PetWeightScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const pet = MOCK_PETS.find((p) => p.id === petId) ?? MOCK_PETS[0];
  const [records, setRecords] = useState<WeightRecord[]>(MOCK_WEIGHT_RECORDS[pet.id] ?? []);
  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');

  const latest = records[0];
  const oldest = records[records.length - 1];
  const lowest = useMemo(() => (records.length ? Math.min(...records.map((r) => r.weightKg)) : null), [records]);
  const change = latest && oldest ? Math.round((latest.weightKg - oldest.weightKg) * 10) / 10 : null;

  const handleAdd = () => {
    if (!date.trim() || !weight.trim()) return;
    const weightKg = Number(weight);
    if (Number.isNaN(weightKg)) return;

    setRecords((prev) => [{ id: `w-${Date.now()}`, weightKg, measuredAt: date.trim() }, ...prev]);
    setDate('');
    setWeight('');
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEdit = () => {
    Alert.alert('수정', '체중 기록 수정 기능은 준비 중이에요.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>PET WEIGHT</Text>
          <Text style={styles.title}>체중 관리</Text>
        </View>
        <TouchableOpacity style={styles.outlineButton} onPress={() => router.back()}>
          <Text style={styles.outlineButtonText}>상세정보 보기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.petNameRow}>
          <Text style={styles.petName}>{pet.name}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>총 {records.length}개</Text>
          </View>
        </View>
        {latest ? (
          <Text style={styles.summaryText}>
            최근 체중은 {latest.weightKg}kg이며, 최근 측정일은 {latest.measuredAt}입니다.
          </Text>
        ) : (
          <Text style={styles.summaryText}>등록된 체중 기록이 없어요.</Text>
        )}
      </View>

      {records.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>WEIGHT TREND</Text>
          <Text style={styles.sectionTitle}>체중 추이 그래프</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>최신 체중</Text>
              <Text style={styles.statValue}>{latest.weightKg}kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>최저 체중</Text>
              <Text style={styles.statValue}>{lowest}kg</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>변화량</Text>
              <Text style={[styles.statValue, change != null && change > 0 && styles.statValuePositive]}>
                {change != null && change > 0 ? '+' : ''}
                {change}kg
              </Text>
            </View>
          </View>
          <WeightChart records={records.slice(0, 5)} />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.eyebrow}>WEIGHT RECORDS</Text>
        <Text style={styles.sectionTitle}>체중 기록 관리</Text>
        <Text style={styles.sectionHint}>기록을 추가하고, 잘못 입력한 값은 바로 수정하거나 삭제할 수 있어요.</Text>

        <TextInput
          style={styles.input}
          placeholder="측정 날짜 (YYYY-MM-DD)"
          placeholderTextColor={DodoColors.fenceIdleLabel}
          value={date}
          onChangeText={setDate}
        />
        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, styles.weightInput]}
            placeholder="예: 5.4"
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>추가</Text>
          </TouchableOpacity>
        </View>

        {records.map((record, index) => (
          <View key={record.id} style={[styles.recordRow, index === records.length - 1 && styles.recordRowLast]}>
            <View>
              <Text style={styles.recordWeight}>{record.weightKg}kg</Text>
              <Text style={styles.recordDate}>측정일 {record.measuredAt}</Text>
            </View>
            <View style={styles.recordActions}>
              <TouchableOpacity style={styles.recordActionButton} onPress={handleEdit}>
                <Text style={styles.recordActionText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.recordActionButton, styles.recordDeleteButton]}
                onPress={() => handleDelete(record.id)}
              >
                <Text style={styles.recordDeleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
    gap: 8,
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#fdead9',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: DodoColors.brand,
  },
  summaryText: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DodoColors.textPrimary,
    marginTop: -4,
  },
  sectionHint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    marginTop: -6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
  },
  statItem: {
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: DodoColors.fenceIdleLabel,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  statValuePositive: {
    color: DodoColors.brand,
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: CHART_PADDING - 8,
  },
  chartLabel: {
    fontSize: 10,
    color: DodoColors.fenceIdleLabel,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 10,
    fontSize: 12,
    color: DodoColors.textPrimary,
  },
  weightInput: {
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.background,
  },
  recordRowLast: {
    borderBottomWidth: 0,
  },
  recordWeight: {
    fontSize: 14,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  recordDate: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    marginTop: 2,
  },
  recordActions: {
    flexDirection: 'row',
    gap: 6,
  },
  recordActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  recordActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  recordDeleteButton: {
    borderColor: DodoColors.fenceOutside,
  },
  recordDeleteText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.fenceOutside,
  },
});
