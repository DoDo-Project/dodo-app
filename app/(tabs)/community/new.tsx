import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { DodoColors } from '@/constants/theme';

export default function NewPostScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

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
          <Text style={styles.hint}>PNG, JPG 형식 / 최대 10MB</Text>
          {/* TODO(이슈7): expo-image-picker 설치 후 실제 첨부 연동 */}
          <TouchableOpacity style={styles.addImageButton}>
            <Ionicons name="image-outline" size={16} color={DodoColors.textSecondary} />
            <Text style={styles.addImageText}>이미지 추가</Text>
          </TouchableOpacity>
          <View style={styles.imageEmpty}>
            <Text style={styles.imageEmptyText}>아직 첨부된 이미지가 없어요.</Text>
          </View>
        </View>

        <Text style={styles.requiredHint}>* 필수 입력 항목입니다.</Text>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>취소</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>임시 저장</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
          disabled={!canSubmit}
        >
          <Text style={styles.primaryButtonText}>게시하기</Text>
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
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.surface,
  },
  addImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  imageEmpty: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: DodoColors.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmptyText: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
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
