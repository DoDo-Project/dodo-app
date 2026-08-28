import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { BoardPost, PostListCard } from '@/components/community/post-row';
import { DodoColors } from '@/constants/theme';
import { getMyBoards, getMyComments, type BoardListItem } from '@/shared/api/communityApi';
import { formatShortDate } from '@/shared/lib/format/date';

function toBoardPost(board: BoardListItem): BoardPost {
  return {
    id: String(board.boardId),
    title: board.boardTitle,
    preview: board.boardContentPreview,
    author: board.nickname,
    date: formatShortDate(board.createdAt),
    likeCount: board.likeCount,
    commentCount: board.commentCount,
    viewCount: board.viewCount,
  };
}

type TabKey = 'posts' | 'comments';

export default function MyActivityScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [postsPage, setPostsPage] = useState(0);
  const [commentsPage, setCommentsPage] = useState(0);

  const postsQuery = useQuery({
    queryKey: ['boards', 'me', postsPage],
    queryFn: () => getMyBoards(postsPage, 10),
    enabled: activeTab === 'posts',
  });

  const commentsQuery = useQuery({
    queryKey: ['comments', 'me', commentsPage],
    queryFn: () => getMyComments(commentsPage, 10),
    enabled: activeTab === 'comments',
  });

  const posts = postsQuery.data?.boards ?? [];
  // 웹과 동일: /boards/me 응답엔 totalPages가 없어 length>=size 휴리스틱으로 다음 페이지 여부 판단
  const postsHasNext = posts.length >= 10;
  const comments = commentsQuery.data?.data ?? [];
  const commentsPageInfo = commentsQuery.data?.pageInfo;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MY COMMUNITY</Text>
      <Text style={styles.title}>내 활동</Text>
      <Text style={styles.subtitle}>내가 남긴 게시글과 댓글 활동을 한곳에서 확인해보세요.</Text>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('posts')}>
          <Text style={[styles.tabLabel, activeTab === 'posts' && styles.tabLabelActive]}>내 게시글</Text>
          {activeTab === 'posts' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('comments')}>
          <Text style={[styles.tabLabel, activeTab === 'comments' && styles.tabLabelActive]}>내 댓글</Text>
          {activeTab === 'comments' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {activeTab === 'posts' ? (
        postsQuery.isLoading ? (
          <ActivityIndicator color={DodoColors.brand} />
        ) : posts.length === 0 ? (
          <View style={styles.commentsEmptyCard}>
            <Text style={styles.commentsEmptyText}>아직 작성한 게시글이 없어요.</Text>
          </View>
        ) : (
          <PostListCard posts={posts.map(toBoardPost)} />
        )
      ) : commentsQuery.isLoading ? (
        <ActivityIndicator color={DodoColors.brand} />
      ) : comments.length === 0 ? (
        <View style={styles.commentsEmptyCard}>
          <Text style={styles.commentsEmptyText}>아직 작성한 댓글이 없어요.</Text>
        </View>
      ) : (
        <View style={styles.commentsCard}>
          {comments.map((comment, index) => (
            <Link
              key={comment.commentId}
              href={{ pathname: '/(tabs)/community/[boardId]', params: { boardId: String(comment.boardId) } }}
              asChild
            >
              <TouchableOpacity style={[styles.commentRow, index === comments.length - 1 && styles.commentRowLast]}>
                <Text style={styles.commentBoardTitle} numberOfLines={1}>
                  {comment.boardTitle}
                </Text>
                <Text style={styles.commentContent} numberOfLines={1}>
                  {comment.commentContent}
                </Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      )}

      <View style={styles.pagination}>
        <TouchableOpacity
          style={styles.pageButton}
          disabled={activeTab === 'posts' ? postsPage === 0 : commentsPage === 0}
          onPress={() =>
            activeTab === 'posts' ? setPostsPage((p) => Math.max(0, p - 1)) : setCommentsPage((p) => Math.max(0, p - 1))
          }
        >
          <Text style={styles.pageButtonTextDisabled}>이전</Text>
        </TouchableOpacity>
        <View style={styles.pageNumberActive}>
          <Text style={styles.pageNumberActiveText}>{(activeTab === 'posts' ? postsPage : commentsPage) + 1}</Text>
        </View>
        <TouchableOpacity
          style={styles.pageButton}
          disabled={
            activeTab === 'posts' ? !postsHasNext : !commentsPageInfo || commentsPage + 1 >= commentsPageInfo.totalPages
          }
          onPress={() => (activeTab === 'posts' ? setPostsPage((p) => p + 1) : setCommentsPage((p) => p + 1))}
        >
          <Text style={styles.pageButtonTextDisabled}>다음</Text>
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
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.brand,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.border,
    marginBottom: 12,
  },
  tabItem: {
    paddingVertical: 10,
    marginRight: 24,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: DodoColors.fenceIdleLabel,
  },
  tabLabelActive: {
    color: DodoColors.textPrimary,
  },
  tabIndicator: {
    marginTop: 8,
    height: 2,
    width: '100%',
    backgroundColor: DodoColors.brand,
  },
  commentsEmptyCard: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    paddingVertical: 40,
    alignItems: 'center',
  },
  commentsEmptyText: {
    fontSize: 13,
    color: DodoColors.fenceIdleLabel,
  },
  commentsCard: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    paddingHorizontal: 16,
  },
  commentRow: {
    paddingVertical: 14,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: DodoColors.background,
  },
  commentRowLast: {
    borderBottomWidth: 0,
  },
  commentBoardTitle: {
    fontSize: 12,
    color: DodoColors.fenceIdleLabel,
  },
  commentContent: {
    fontSize: 14,
    color: DodoColors.textPrimary,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  pageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  pageButtonTextDisabled: {
    fontSize: 12,
    color: DodoColors.border,
  },
  pageNumberActive: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: DodoColors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberActiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: DodoColors.brandForeground,
  },
});
