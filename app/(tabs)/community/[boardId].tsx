import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
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

// TODO(이슈4): GET /boards/{boardId}, GET /comments/{boardId} 연동 후 mock 제거
const MOCK_POSTS_BY_ID: Record<
  string,
  {
    author: string;
    date: string;
    viewCount: number;
    title: string;
    body: string;
    likeCount: number;
    dislikeCount: number;
    isOwner: boolean;
  }
> = {
  '1': {
    author: '조펭이',
    date: '2026. 06. 12. 오후 07:33',
    viewCount: 5,
    title: '안녕',
    body: 'ㅎㅇ',
    likeCount: 4,
    dislikeCount: 2,
    isOwner: true,
  },
  '2': {
    author: '조펭이',
    date: '2026. 06. 12. 오후 07:40',
    viewCount: 2,
    title: '마루는 강쥐',
    body: '귀여움',
    likeCount: 3,
    dislikeCount: 0,
    isOwner: true,
  },
  '3': {
    author: '꾸우',
    date: '2026. 06. 15. 오후 03:12',
    viewCount: 15,
    title: '안녕하세요',
    body: '저는 야르릉입니다!!!',
    likeCount: 2,
    dislikeCount: 0,
    isOwner: false,
  },
};

export default function BoardDetailScreen() {
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const [comment, setComment] = useState('');
  const post = MOCK_POSTS_BY_ID[boardId] ?? MOCK_POSTS_BY_ID['1'];

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Ionicons name="paw" size={18} color={DodoColors.brandForeground} />
            </View>
            <View style={styles.authorTextCol}>
              <Text style={styles.authorName}>{post.author}</Text>
              <View style={styles.authorMetaRow}>
                <Text style={styles.authorMetaText}>{post.date}</Text>
                <Text style={styles.postMetaDivider}>|</Text>
                <Ionicons name="eye-outline" size={12} color={DodoColors.fenceIdleLabel} />
                <Text style={styles.authorMetaText}>조회 {post.viewCount}</Text>
              </View>
            </View>
          </View>

          {post.isOwner && (
            <View style={styles.editRow}>
              <TouchableOpacity>
                <Text style={styles.editLink}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.editLink}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.title}>{post.title}</Text>

          <View style={styles.photo}>
            <Ionicons name="image-outline" size={40} color={DodoColors.fenceIdleLabel} />
          </View>

          <Text style={styles.body}>{post.body}</Text>

          <View style={styles.divider} />

          <View style={styles.reactionRow}>
            <TouchableOpacity style={styles.reactionButton}>
              <Ionicons name="thumbs-up-outline" size={16} color={DodoColors.textPrimary} />
              <Text style={styles.reactionText}>좋아요 {post.likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reactionButton}>
              <Ionicons name="thumbs-down-outline" size={16} color={DodoColors.textPrimary} />
              <Text style={styles.reactionText}>싫어요 {post.dislikeCount}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.commentHeader}>댓글 0</Text>
          <View style={styles.commentEmpty}>
            <Text style={styles.commentEmptyText}>아직 댓글이 없어요. 첫 댓글을 남겨보세요.</Text>
          </View>
        </ScrollView>

        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="댓글을 입력해주세요."
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity style={styles.commentSubmit}>
            <Text style={styles.commentSubmitText}>등록</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DodoColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorTextCol: {
    gap: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  authorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  authorMetaText: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
  },
  postMetaDivider: {
    fontSize: 11,
    color: DodoColors.border,
    marginHorizontal: 4,
  },
  editRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editLink: {
    fontSize: 12,
    color: DodoColors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: DodoColors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: DodoColors.surface,
    borderWidth: 1,
    borderColor: DodoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: DodoColors.textPrimary,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DodoColors.border,
    backgroundColor: DodoColors.surface,
  },
  reactionText: {
    fontSize: 13,
    fontWeight: '600',
    color: DodoColors.textPrimary,
  },
  commentHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: DodoColors.textPrimary,
    marginTop: 8,
  },
  commentEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  commentEmptyText: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: DodoColors.border,
    backgroundColor: DodoColors.surface,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    backgroundColor: DodoColors.background,
    paddingHorizontal: 16,
    fontSize: 13,
    color: DodoColors.textPrimary,
  },
  commentSubmit: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 999,
    backgroundColor: DodoColors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
});
