import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { getBoardDetail, tempSaveBoard, updateBoard } from '@/shared/api/communityApi';

export default function EditPostScreen() {
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const boardQuery = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => getBoardDetail(boardId),
    enabled: !!boardId,
  });

  useEffect(() => {
    if (boardQuery.data) {
      setTitle(boardQuery.data.boardTitle);
      setContent(boardQuery.data.boardContent);
      setImageUrls(boardQuery.data.imageFileUrls);
    }
  }, [boardQuery.data]);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const submitMutation = useMutation({
    mutationFn: () =>
      updateBoard(boardId, {
        boardTitle: title.trim(),
        boardContent: content.trim(),
        imageFileUrls: imageUrls,
      }),
    onSuccess: () => {
      router.replace({ pathname: '/(tabs)/community/[boardId]', params: { boardId } });
    },
    onError: () => Alert.alert('오류', '게시글을 수정하지 못했어요. 잠시 후 다시 시도해주세요.'),
  });

  const tempSaveMutation = useMutation({
    mutationFn: () =>
      tempSaveBoard({ boardTitle: title.trim(), boardContent: content.trim(), imageFileUrls: imageUrls }, boardId),
    onSuccess: () => Alert.alert('임시 저장', '수정 중인 내용을 임시 저장했어요.'),
    onError: () => Alert.alert('오류', '임시 저장에 실패했어요.'),
  });

  if (boardQuery.isLoading || !boardQuery.data) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

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
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>게시글 내용 *</Text>
          <TextInput
            style={styles.textarea}
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>이미지 첨부</Text>
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
          <Text style={styles.primaryButtonText}>{submitMutation.isPending ? '수정 중...' : '수정하기'}</Text>
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
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
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
