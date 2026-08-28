import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

import { DodoColors } from '@/constants/theme';
import {
  createBoardReaction,
  createComment,
  deleteBoard,
  deleteBoardReaction,
  deleteComment,
  getBoardDetail,
  getCommentNickname,
  getComments,
  getCommentTimestamp,
  getMyReaction,
  updateBoardReaction,
  type ReactionType,
} from '@/shared/api/communityApi';
import { useAuthStore } from '@/shared/lib/auth/authStore';
import { formatFullDateTime } from '@/shared/lib/format/date';

export default function BoardDetailScreen() {
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const myNickname = useAuthStore((state) => state.profile.nickname);
  const [comment, setComment] = useState('');
  const [commentsPage, setCommentsPage] = useState(0);

  const boardQuery = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => getBoardDetail(boardId),
    enabled: !!boardId,
  });

  const commentsQuery = useQuery({
    queryKey: ['comments', boardId, commentsPage],
    queryFn: () => getComments(boardId, commentsPage, 20),
    enabled: !!boardId,
  });

  const invalidateBoard = () => queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  const invalidateComments = () => queryClient.invalidateQueries({ queryKey: ['comments', boardId] });

  const reactMutation = useMutation({
    mutationFn: async (reactionType: ReactionType) => {
      const current = boardQuery.data ? getMyReaction(boardQuery.data) : null;
      if (current === reactionType) {
        await deleteBoardReaction(boardId);
      } else if (current) {
        await updateBoardReaction(boardId, reactionType);
      } else {
        await createBoardReaction(Number(boardId), reactionType);
      }
    },
    onSuccess: invalidateBoard,
    onError: () => {
      Alert.alert('오류', '반응을 처리하지 못했어요.');
      invalidateBoard();
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => createComment({ boardId: Number(boardId), commentContent: content }),
    onSuccess: () => {
      setComment('');
      invalidateComments();
      invalidateBoard();
    },
    onError: () => Alert.alert('오류', '댓글을 등록하지 못했어요.'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      invalidateComments();
      invalidateBoard();
    },
    onError: () => Alert.alert('오류', '댓글을 삭제하지 못했어요.'),
  });

  const deleteBoardMutation = useMutation({
    mutationFn: () => deleteBoard(boardId),
    onSuccess: () => router.replace('/(tabs)/community'),
    onError: () => Alert.alert('오류', '게시글을 삭제하지 못했어요.'),
  });

  const handleDeleteBoard = () => {
    Alert.alert('게시글 삭제', '이 게시글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제하기', style: 'destructive', onPress: () => deleteBoardMutation.mutate() },
    ]);
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('댓글 삭제', '이 댓글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteCommentMutation.mutate(commentId) },
    ]);
  };

  if (boardQuery.isLoading || !boardQuery.data) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={DodoColors.brand} />
      </View>
    );
  }

  const post = boardQuery.data;
  // 웹과 동일: 작성자 여부는 서버 플래그가 아니라 닉네임 문자열 비교로 클라이언트에서만 판단
  const isOwner = !!myNickname && post.nickname === myNickname;
  const myReaction = getMyReaction(post);
  const comments = commentsQuery.data?.data ?? [];
  const pageInfo = commentsQuery.data?.pageInfo;

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
              <Text style={styles.authorName}>{post.nickname}</Text>
              <View style={styles.authorMetaRow}>
                <Text style={styles.authorMetaText}>{formatFullDateTime(post.boardCreatedAt)}</Text>
                <Text style={styles.postMetaDivider}>|</Text>
                <Ionicons name="eye-outline" size={12} color={DodoColors.fenceIdleLabel} />
                <Text style={styles.authorMetaText}>조회 {post.viewCount}</Text>
              </View>
            </View>
          </View>

          {isOwner && (
            <View style={styles.editRow}>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/(tabs)/community/[boardId]/edit', params: { boardId } })}
              >
                <Text style={styles.editLink}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteBoard}>
                <Text style={styles.editLink}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.title}>{post.boardTitle}</Text>

          {post.imageFileUrls.length === 0 && (
            <View style={styles.photo}>
              <Ionicons name="image-outline" size={40} color={DodoColors.fenceIdleLabel} />
            </View>
          )}

          <Text style={styles.body}>{post.boardContent}</Text>

          <View style={styles.divider} />

          <View style={styles.reactionRow}>
            <TouchableOpacity
              style={[styles.reactionButton, myReaction === 'LIKE' && styles.reactionButtonActive]}
              disabled={reactMutation.isPending}
              onPress={() => reactMutation.mutate('LIKE')}
            >
              <Ionicons name="thumbs-up-outline" size={16} color={DodoColors.textPrimary} />
              <Text style={styles.reactionText}>좋아요 {post.likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reactionButton, myReaction === 'DISLIKE' && styles.reactionButtonActive]}
              disabled={reactMutation.isPending}
              onPress={() => reactMutation.mutate('DISLIKE')}
            >
              <Ionicons name="thumbs-down-outline" size={16} color={DodoColors.textPrimary} />
              <Text style={styles.reactionText}>싫어요 {post.dislikeCount}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.commentHeader}>댓글 {pageInfo?.totalElements ?? comments.length}</Text>
          {commentsQuery.isLoading ? (
            <ActivityIndicator color={DodoColors.brand} />
          ) : comments.length === 0 ? (
            <View style={styles.commentEmpty}>
              <Text style={styles.commentEmptyText}>아직 댓글이 없어요. 첫 댓글을 남겨보세요.</Text>
            </View>
          ) : (
            comments
              .filter((c) => c.parentCommentId === null)
              .map((parent) => (
                <View key={parent.commentId} style={styles.commentBlock}>
                  <CommentRow
                    nickname={getCommentNickname(parent)}
                    content={parent.commentContent}
                    date={formatFullDateTime(getCommentTimestamp(parent) ?? '')}
                    canDelete={!!myNickname && getCommentNickname(parent) === myNickname}
                    onDelete={() => handleDeleteComment(parent.commentId)}
                  />
                  {comments
                    .filter((c) => c.parentCommentId === parent.commentId)
                    .map((reply) => (
                      <View key={reply.commentId} style={styles.replyRow}>
                        <CommentRow
                          nickname={getCommentNickname(reply)}
                          content={reply.commentContent}
                          date={formatFullDateTime(getCommentTimestamp(reply) ?? '')}
                          canDelete={!!myNickname && getCommentNickname(reply) === myNickname}
                          onDelete={() => handleDeleteComment(reply.commentId)}
                        />
                      </View>
                    ))}
                </View>
              ))
          )}

          {pageInfo && pageInfo.totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={styles.pageButton}
                disabled={commentsPage === 0}
                onPress={() => setCommentsPage((p) => Math.max(0, p - 1))}
              >
                <Text style={commentsPage === 0 ? styles.pageButtonTextDisabled : styles.pageButtonText}>이전</Text>
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>
                {commentsPage + 1} / {pageInfo.totalPages}
              </Text>
              <TouchableOpacity
                style={styles.pageButton}
                disabled={commentsPage + 1 >= pageInfo.totalPages}
                onPress={() => setCommentsPage((p) => p + 1)}
              >
                <Text
                  style={
                    commentsPage + 1 >= pageInfo.totalPages ? styles.pageButtonTextDisabled : styles.pageButtonText
                  }
                >
                  다음
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="댓글을 입력해주세요."
            placeholderTextColor={DodoColors.fenceIdleLabel}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity
            style={styles.commentSubmit}
            disabled={!comment.trim() || commentMutation.isPending}
            onPress={() => commentMutation.mutate(comment.trim())}
          >
            <Text style={styles.commentSubmitText}>등록</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function CommentRow({
  nickname,
  content,
  date,
  canDelete,
  onDelete,
}: {
  nickname: string;
  content: string;
  date: string;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <View style={styles.commentRow}>
      <View style={styles.commentTextCol}>
        <Text style={styles.commentAuthor}>{nickname}</Text>
        <Text style={styles.commentContent}>{content}</Text>
        <Text style={styles.commentDate}>{date}</Text>
      </View>
      {canDelete && (
        <TouchableOpacity onPress={onDelete}>
          <Text style={styles.commentDeleteText}>삭제</Text>
        </TouchableOpacity>
      )}
    </View>
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
  reactionButtonActive: {
    borderColor: DodoColors.brand,
    backgroundColor: DodoColors.background,
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
  commentBlock: {
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.background,
  },
  replyRow: {
    paddingLeft: 20,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  commentTextCol: {
    flex: 1,
    gap: 2,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  commentContent: {
    fontSize: 13,
    color: DodoColors.textPrimary,
  },
  commentDate: {
    fontSize: 10,
    color: DodoColors.fenceIdleLabel,
  },
  commentDeleteText: {
    fontSize: 11,
    color: DodoColors.fenceOutside,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  pageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  pageButtonText: {
    fontSize: 12,
    color: DodoColors.textPrimary,
  },
  pageButtonTextDisabled: {
    fontSize: 12,
    color: DodoColors.border,
  },
  pageIndicator: {
    fontSize: 12,
    color: DodoColors.textSecondary,
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
