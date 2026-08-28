import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { Circle, Polyline, Svg } from 'react-native-svg';

import { DatePickerModal } from '@/components/common/date-picker-modal';
import { DodoColors } from '@/constants/theme';
import {
  createWeightRecord,
  deleteWeightRecord,
  getPetDetail,
  getWeightHistory,
  updateWeightRecord,
  type WeightRecord,
} from '@/shared/api/petApi';

const CHART_WIDTH = 300;
const CHART_HEIGHT = 140;
const CHART_PADDING = 20;

function WeightChart({ records }: { records: WeightRecord[] }) {
  const oldestFirst = [...records].reverse();
  const values = oldestFirst.map((r) => r.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = oldestFirst.map((record, index) => {
    const x = CHART_PADDING + (index * (CHART_WIDTH - CHART_PADDING * 2)) / Math.max(oldestFirst.length - 1, 1);
    const y = CHART_PADDING + (1 - (record.weight - min) / range) * (CHART_HEIGHT - CHART_PADDING * 2);
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
          <Circle key={p.record.weightId} cx={p.x} cy={p.y} r={4} fill={DodoColors.brand} />
        ))}
      </Svg>
      <View style={styles.chartLabelsRow}>
        {oldestFirst.map((r) => (
          <Text key={r.weightId} style={styles.chartLabel}>
            {r.petWeightsMeasuredAt?.slice(5, 10).replace('-', '.')}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function PetWeightScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const petQuery = useQuery({ queryKey: ['pets', petId], queryFn: () => getPetDetail(petId), enabled: !!petId });
  const weightQuery = useQuery({
    queryKey: ['pets', petId, 'weight'],
    queryFn: () => getWeightHistory(petId, 0, 15),
    enabled: !!petId,
  });

  const [date, setDate] = useState('');
  const [weight, setWeight] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDate, setEditingDate] = useState('');
  const [editingWeight, setEditingWeight] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [editDatePickerVisible, setEditDatePickerVisible] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['pets', petId, 'weight'] });

  const addMutation = useMutation({
    mutationFn: () => createWeightRecord(petId, Number(weight), `${date.trim()}T00:00:00`),
    onSuccess: () => {
      setDate('');
      setWeight('');
      invalidate();
    },
    onError: () => Alert.alert('오류', '체중 기록을 추가하지 못했어요.'),
  });

  const updateMutation = useMutation({
    mutationFn: (weightId: number) =>
      updateWeightRecord(petId, weightId, {
        weight: editingWeight ? Number(editingWeight) : undefined,
        petWeightsMeasuredAt: editingDate ? `${editingDate.trim()}T00:00:00` : undefined,
      }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: () => Alert.alert('오류', '체중 기록을 수정하지 못했어요.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (weightId: number) => deleteWeightRecord(petId, weightId),
    onSuccess: invalidate,
    onError: () => Alert.alert('오류', '체중 기록을 삭제하지 못했어요.'),
  });

  const records = useMemo(() => weightQuery.data?.records ?? [], [weightQuery.data]);
  const latest = records[0];
  const oldest = records[records.length - 1];
  const lowest = useMemo(() => (records.length ? Math.min(...records.map((r) => r.weight)) : null), [records]);
  const change = latest && oldest ? Math.round((latest.weight - oldest.weight) * 10) / 10 : null;

  const startEdit = (record: WeightRecord) => {
    setEditingId(record.weightId);
    setEditingDate(record.petWeightsMeasuredAt?.slice(0, 10) ?? '');
    setEditingWeight(String(record.weight));
  };

  return (
    <>
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
            <Text style={styles.petName}>{petQuery.data?.petName ?? ''}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>총 {records.length}개</Text>
            </View>
          </View>
          {weightQuery.isLoading ? (
            <ActivityIndicator color={DodoColors.brand} />
          ) : latest ? (
            <Text style={styles.summaryText}>
              최근 체중은 {latest.weight}kg이며, 최근 측정일은 {latest.petWeightsMeasuredAt?.slice(0, 10)}입니다.
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
                <Text style={styles.statValue}>{latest.weight}kg</Text>
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

          <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisible(true)}>
            <Text style={date ? styles.dateValue : styles.datePlaceholder}>{date || '측정 날짜 선택'}</Text>
          </TouchableOpacity>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.weightInput]}
              placeholder="예: 5.4"
              placeholderTextColor={DodoColors.fenceIdleLabel}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.addButton}
              disabled={!date.trim() || !weight.trim() || addMutation.isPending}
              onPress={() => addMutation.mutate()}
            >
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
          </View>

          {records.map((record, index) => {
            const isEditing = editingId === record.weightId;
            return (
              <View
                key={record.weightId}
                style={[styles.recordRow, index === records.length - 1 && styles.recordRowLast]}
              >
                {isEditing ? (
                  <>
                    <View style={styles.editFields}>
                      <TouchableOpacity style={styles.editInput} onPress={() => setEditDatePickerVisible(true)}>
                        <Text style={editingDate ? styles.dateValue : styles.datePlaceholder}>
                          {editingDate || '날짜 선택'}
                        </Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.editInput}
                        value={editingWeight}
                        onChangeText={setEditingWeight}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.recordActions}>
                      <TouchableOpacity
                        style={styles.recordActionButton}
                        onPress={() => updateMutation.mutate(record.weightId)}
                      >
                        <Text style={styles.recordActionText}>저장</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.recordActionButton} onPress={() => setEditingId(null)}>
                        <Text style={styles.recordActionText}>취소</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View>
                      <Text style={styles.recordWeight}>{record.weight}kg</Text>
                      <Text style={styles.recordDate}>측정일 {record.petWeightsMeasuredAt?.slice(0, 10)}</Text>
                    </View>
                    <View style={styles.recordActions}>
                      <TouchableOpacity style={styles.recordActionButton} onPress={() => startEdit(record)}>
                        <Text style={styles.recordActionText}>수정</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.recordActionButton, styles.recordDeleteButton]}
                        onPress={() => deleteMutation.mutate(record.weightId)}
                      >
                        <Text style={styles.recordDeleteText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <DatePickerModal
        visible={datePickerVisible}
        initialDate={date}
        maxDate={todayString()}
        minDate={petQuery.data?.birth?.slice(0, 10)}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={setDate}
      />
      <DatePickerModal
        visible={editDatePickerVisible}
        initialDate={editingDate}
        maxDate={todayString()}
        minDate={petQuery.data?.birth?.slice(0, 10)}
        onClose={() => setEditDatePickerVisible(false)}
        onConfirm={setEditingDate}
      />
    </>
  );
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
    justifyContent: 'center',
  },
  weightInput: {
    flex: 1,
  },
  dateValue: {
    fontSize: 12,
    color: DodoColors.textPrimary,
  },
  datePlaceholder: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
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
  editFields: {
    flex: 1,
    gap: 6,
    marginRight: 8,
  },
  editInput: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 10,
    fontSize: 12,
    color: DodoColors.textPrimary,
    justifyContent: 'center',
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
