import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BoardPost, PostListCard } from '@/components/community/post-row';
import { DodoColors } from '@/constants/theme';

// TODO(이슈4): GET /boards/me, GET /comments/me 연동 후 mock 제거
const MOCK_MY_POSTS: BoardPost[] = [
  {
    id: '4',
    title: '오늘 산책하다 만난 귀여운 친구들',
    preview: '귀여운 아기들을 봤어요~~',
    author: '조펭이',
    date: '6월 12일',
    likeCount: 1,
    commentCount: 0,
    viewCount: 4,
  },
  {
    id: '2',
    title: '마루는 강쥐',
    preview: '귀여움',
    author: '조펭이',
    date: '6월 12일',
    likeCount: 3,
    commentCount: 0,
    viewCount: 2,
  },
  {
    id: '1',
    title: '안녕',
    preview: 'ㅎㅇ',
    author: '조펭이',
    date: '6월 12일',
    likeCount: 4,
    commentCount: 0,
    viewCount: 5,
  },
];

type TabKey = 'posts' | 'comments';

export default function MyActivityScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('posts');

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
        <PostListCard posts={MOCK_MY_POSTS} />
      ) : (
        <View style={styles.commentsEmptyCard}>
          <Text style={styles.commentsEmptyText}>댓글 목록 준비 중</Text>
        </View>
      )}

      <View style={styles.pagination}>
        <TouchableOpacity style={styles.pageButton} disabled>
          <Text style={styles.pageButtonTextDisabled}>이전</Text>
        </TouchableOpacity>
        <View style={styles.pageNumberActive}>
          <Text style={styles.pageNumberActiveText}>1</Text>
        </View>
        <TouchableOpacity style={styles.pageButton} disabled>
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
