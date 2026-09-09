import Ionicons from '@expo/vector-icons/Ionicons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoardPost, PostListCard } from '@/components/community/post-row';
import { DodoColors } from '@/constants/theme';
import { getBoards, type BoardListItem } from '@/shared/api/communityApi';
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
    thumbnailImageUrl: board.thumbnailImageUrl,
  };
}

const PAGE_SIZE = 12;

export default function CommunityListScreen() {
  const insets = useSafeAreaInsets();

  const boardsQuery = useInfiniteQuery({
    queryKey: ['boards'],
    queryFn: ({ pageParam }) => getBoards({ page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.boards.length >= PAGE_SIZE ? allPages.length : undefined),
  });

  const boards = useMemo(() => boardsQuery.data?.pages.flatMap((p) => p.boards) ?? [], [boardsQuery.data]);

  // 웹과 동일: 별도 인기글 API 없음 — 이미 불러온 게시글 중 좋아요순 상위 3개만 클라이언트에서 정렬
  const popular = useMemo(() => [...boards].sort((a, b) => b.likeCount - a.likeCount).slice(0, 3), [boards]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.topRow}>
          <Text style={styles.screenTitle}>커뮤니티</Text>
          <Link href="/(tabs)/community/my" asChild>
            <TouchableOpacity style={styles.myActivityLink}>
              <Ionicons name="person-circle-outline" size={16} color={DodoColors.textSecondary} />
              <Text style={styles.myActivityText}>내 활동</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {boardsQuery.isLoading ? (
          <ActivityIndicator color={DodoColors.brand} style={styles.loading} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.eyebrow}>POPULAR PICKS</Text>
              <Text style={styles.sectionTitle}>인기 게시물</Text>
              <Text style={styles.sectionSubtitle}>지금 커뮤니티에서 반응이 좋은 이야기를 먼저 만나보세요.</Text>
              <PostListCard posts={popular.map(toBoardPost)} />
            </View>

            <View style={styles.section}>
              <Text style={styles.eyebrow}>COMMUNITY BOARD</Text>
              <Text style={styles.sectionTitle}>최근 게시물</Text>
              <Text style={styles.sectionSubtitle}>반려생활 속 소소한 기록부터 유용한 팁까지 한눈에 둘러보세요.</Text>
              <PostListCard posts={boards.map(toBoardPost)} />

              {boardsQuery.hasNextPage && (
                <TouchableOpacity
                  style={styles.moreButton}
                  disabled={boardsQuery.isFetchingNextPage}
                  onPress={() => boardsQuery.fetchNextPage()}
                >
                  <Text style={styles.moreButtonText}>
                    {boardsQuery.isFetchingNextPage ? '불러오는 중...' : '더 보기'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Link href="/(tabs)/community/new" asChild>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="create-outline" size={22} color={DodoColors.brandForeground} />
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DodoColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 20,
  },
  loading: {
    marginTop: 40,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  myActivityLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: DodoColors.surface,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  myActivityText: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    fontWeight: '600',
  },
  section: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: DodoColors.brand,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: DodoColors.textSecondary,
    marginBottom: 12,
  },
  moreButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DodoColors.border,
  },
  moreButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: DodoColors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: DodoColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
