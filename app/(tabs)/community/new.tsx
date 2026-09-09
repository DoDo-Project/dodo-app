import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MultiImagePicker } from '@/components/common/multi-image-picker';
import { DodoColors } from '@/constants/theme';
import { createBoard, getTempSaveBoard, tempSaveBoard } from '@/shared/api/communityApi';

const DRAFT_SESSION_KEY_STORAGE = 'dodo.boardDraft.sessionKey';

export default function NewPostScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  // 웹과 동일: 임시저장 세션키가 로컬에 있으면 진입 시 자동으로 불러와 폼을 프리필한다.
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_SESSION_KEY_STORAGE).then(async (sessionKey) => {
      if (!sessionKey) return;
      try {
        const draft = await getTempSaveBoard(sessionKey);
        if (draft.boardTitle) setTitle(draft.boardTitle);
        if (draft.boardContent) setContent(draft.boardContent);
        if (draft.imageFileUrls) setImageUrls(draft.imageFileUrls);
        else if (draft.imageFileUrl) setImageUrls([draft.imageFileUrl]);
      } catch {
        await AsyncStorage.removeItem(DRAFT_SESSION_KEY_STORAGE);
      }
    });
  }, []);

  const submitMutation = useMutation({
    mutationFn: () => createBoard({ boardTitle: title.trim(), boardContent: content.trim(), imageFileUrls: imageUrls }),
    onSuccess: async ({ boardId }) => {
      await AsyncStorage.removeItem(DRAFT_SESSION_KEY_STORAGE);
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      router.replace({ pathname: '/(tabs)/community/[boardId]', params: { boardId: String(boardId) } });
    },
    onError: () => Alert.alert('오류', '게시글을 등록하지 못했어요. 잠시 후 다시 시도해주세요.'),
  });

  const tempSaveMutation = useMutation({
    mutationFn: () =>
      tempSaveBoard({ boardTitle: title.trim(), boardContent: content.trim(), imageFileUrls: imageUrls }),
    onSuccess: async ({ sessionKey }) => {
      await AsyncStorage.setItem(DRAFT_SESSION_KEY_STORAGE, sessionKey);
      Alert.alert('임시 저장', '작성 중인 내용을 임시 저장했어요.');
    },
    onError: () => Alert.alert('오류', '임시 저장에 실패했어요.'),
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>게시글 제목 *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 오늘 산책하다 만난 귀여운 친구들"
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>게시글 내용 *</Text>
          <TextInput
            style={styles.textarea}
            placeholder="반려동물과의 오늘 이야기를 자유롭게 적어보세요."
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>이미지 첨부</Text>
          <Text style={styles.hint}>PNG, JPG 형식 / 장당 최대 10MB · 전체 최대 50MB</Text>
          <MultiImagePicker imageUrls={imageUrls} onChange={setImageUrls} />
        </View>

        <Text style={styles.requiredHint}>* 필수 입력 항목입니다.</Text>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          disabled={tempSaveMutation.isPending}
          onPress={() => tempSaveMutation.mutate()}
        >
          <Text style={styles.secondaryButtonText}>{tempSaveMutation.isPending ? '저장 중...' : '임시 저장'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, (!canSubmit || submitMutation.isPending) && styles.primaryButtonDisabled]}
          disabled={!canSubmit || submitMutation.isPending}
          onPress={() => submitMutation.mutate()}
        >
          <Text style={styles.primaryButtonText}>{submitMutation.isPending ? '게시 중...' : '게시하기'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  hint: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    marginTop: -4,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.surface,
    paddingHorizontal: 12,
    fontSize: 14,
    color: DodoColors.textPrimary,
  },
  textarea: {
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.surface,
    padding: 12,
    fontSize: 14,
    color: DodoColors.textPrimary,
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
