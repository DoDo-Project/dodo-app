import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

import { DodoColors } from '@/constants/theme';
import {
  createSignificantNote,
  deleteSignificantNote,
  getPetDetail,
  getSignificantNotes,
  NOTE_TYPES,
  updateSignificantNote,
  type NoteType,
} from '@/shared/api/petApi';

const CATEGORY_LABEL: Record<NoteType, string> = {
  ALLERGY: '알레르기',
  HOSPITAL: '병원',
  MEDICATION: '약물',
  FOOD: '음식',
  BEHAVIOR: '행동',
  SYMPTOM: '증상',
  ETC: '기타',
};

const TAG_COLORS: Record<NoteType, string> = {
  ALLERGY: '#fdead9',
  HOSPITAL: '#e0f2fe',
  MEDICATION: '#fdead9',
  FOOD: '#fef9c3',
  BEHAVIOR: '#ede9fe',
  SYMPTOM: '#fee2e2',
  ETC: DodoColors.background,
};

export default function PetNotesScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const petQuery = useQuery({ queryKey: ['pets', petId], queryFn: () => getPetDetail(petId), enabled: !!petId });
  const notesQuery = useQuery({
    queryKey: ['pets', petId, 'notes'],
    queryFn: () => getSignificantNotes(petId, 0, 10),
    enabled: !!petId,
  });

  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteType>('ALLERGY');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filter, setFilter] = useState<'전체' | NoteType>('전체');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingCategory, setEditingCategory] = useState<NoteType>('ALLERGY');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pets', petId, 'notes'] });
    queryClient.invalidateQueries({ queryKey: ['pets', petId] });
  };

  const addMutation = useMutation({
    mutationFn: () => createSignificantNote(Number(petId), content.trim(), category),
    onSuccess: () => {
      setContent('');
      invalidate();
    },
    onError: () => Alert.alert('오류', '특이사항을 추가하지 못했어요.'),
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) => updateSignificantNote(id, editingContent.trim(), editingCategory),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: () => Alert.alert('오류', '특이사항을 수정하지 못했어요.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSignificantNote(id),
    onSuccess: invalidate,
    onError: () => Alert.alert('오류', '특이사항을 삭제하지 못했어요.'),
  });

  const notes = notesQuery.data?.notes ?? [];
  const filteredNotes = notes.filter((n) => filter === '전체' || n.noteType === filter);

  const startEdit = (noteId: number, noteContent: string, noteType: NoteType) => {
    setEditingId(noteId);
    setEditingContent(noteContent);
    setEditingCategory(noteType);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>PET NOTES</Text>
          <Text style={styles.title}>특이사항 관리</Text>
        </View>
        <TouchableOpacity style={styles.outlineButton} onPress={() => router.back()}>
          <Text style={styles.outlineButtonText}>상세정보 보기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.petNameRow}>
          <Text style={styles.petName}>{petQuery.data?.petName ?? ''}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>총 {notes.length}개</Text>
          </View>
        </View>
        <Text style={styles.hintText}>
          {petQuery.data?.petName ?? '반려동물'}의 특이사항을 정리하고 필요한 메모를 추가하거나 수정할 수 있어요.
        </Text>
      </View>

      <View style={[styles.card, styles.addCard]}>
        <View style={styles.addRow}>
          <View style={styles.pickerWrap}>
            <TouchableOpacity style={styles.picker} onPress={() => setPickerOpen((v) => !v)}>
              <Text style={styles.pickerText}>{CATEGORY_LABEL[category]}</Text>
              <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={14} color={DodoColors.textSecondary} />
            </TouchableOpacity>
            {pickerOpen && (
              <View style={styles.pickerOptions}>
                {NOTE_TYPES.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.pickerOption}
                    onPress={() => {
                      setCategory(option);
                      setPickerOpen(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{CATEGORY_LABEL[option]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder="특이사항을 입력해 주세요."
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={content}
            onChangeText={setContent}
          />
          <TouchableOpacity
            style={styles.addButton}
            disabled={!content.trim() || addMutation.isPending}
            onPress={() => addMutation.mutate()}
          >
            <Text style={styles.addButtonText}>추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(['전체', ...NOTE_TYPES] as const).map((f) => {
            const selected = f === filter;
            const label = f === '전체' ? '전체' : CATEGORY_LABEL[f];
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {notesQuery.isLoading ? (
          <ActivityIndicator color={DodoColors.brand} />
        ) : filteredNotes.length === 0 ? (
          <Text style={styles.emptyText}>등록된 특이사항이 없어요.</Text>
        ) : (
          filteredNotes.map((note, index) => {
            const isEditing = editingId === note.noteId;
            return (
              <View
                key={note.noteId}
                style={[styles.noteRow, index === filteredNotes.length - 1 && styles.noteRowLast]}
              >
                {isEditing ? (
                  <>
                    <TextInput
                      style={[styles.input, styles.editInput]}
                      value={editingContent}
                      onChangeText={setEditingContent}
                    />
                    <View style={styles.noteActions}>
                      <TouchableOpacity
                        style={styles.noteActionButton}
                        onPress={() => updateMutation.mutate(note.noteId)}
                      >
                        <Text style={styles.noteActionText}>저장</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.noteActionButton} onPress={() => setEditingId(null)}>
                        <Text style={styles.noteActionText}>취소</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.noteTag, { backgroundColor: TAG_COLORS[note.noteType] }]}>
                      <Text style={styles.noteTagText}>{CATEGORY_LABEL[note.noteType]}</Text>
                    </View>
                    <View style={styles.noteContentCol}>
                      <Text style={styles.noteDate}>{note.createdAt?.slice(0, 10)}</Text>
                      <Text style={styles.noteContent}>{note.noteContent}</Text>
                    </View>
                    <View style={styles.noteActions}>
                      <TouchableOpacity
                        style={styles.noteActionButton}
                        onPress={() => startEdit(note.noteId, note.noteContent, note.noteType)}
                      >
                        <Text style={styles.noteActionText}>수정</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.noteActionButton, styles.noteDeleteButton]}
                        onPress={() => deleteMutation.mutate(note.noteId)}
                      >
                        <Text style={styles.noteDeleteText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
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
  hintText: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  addCard: {
    zIndex: 20,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  pickerWrap: {
    position: 'relative',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
  },
  pickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  pickerOptions: {
    position: 'absolute',
    top: 44,
    left: 0,
    backgroundColor: DodoColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    paddingVertical: 4,
    minWidth: 90,
    zIndex: 20,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickerOptionText: {
    fontSize: 12,
    color: DodoColors.textPrimary,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 12,
    fontSize: 12,
    color: DodoColors.textPrimary,
  },
  editInput: {
    marginRight: 8,
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
  filterScroll: {
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: DodoColors.background,
    marginRight: 6,
  },
  filterChipSelected: {
    backgroundColor: DodoColors.textPrimary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  filterChipTextSelected: {
    color: DodoColors.brandForeground,
  },
  emptyText: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.background,
  },
  noteRowLast: {
    borderBottomWidth: 0,
  },
  noteTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noteTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: DodoColors.textSecondary,
  },
  noteContentCol: {
    flex: 1,
    gap: 2,
  },
  noteDate: {
    fontSize: 10,
    color: DodoColors.fenceIdleLabel,
  },
  noteContent: {
    fontSize: 13,
    color: DodoColors.textPrimary,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 6,
  },
  noteActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  noteActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  noteDeleteButton: {
    borderColor: DodoColors.fenceOutside,
  },
  noteDeleteText: {
    fontSize: 11,
    fontWeight: '600',
    color: DodoColors.fenceOutside,
  },
});
