import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoardPost, PostListCard } from '@/components/community/post-row';
import { DodoColors } from '@/constants/theme';

// TODO(이슈4): GET /boards, /boards?sort=popular 연동 후 mock 제거
const MOCK_POPULAR: BoardPost[] = [
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
    id: '3',
    title: '안녕하세요',
    preview: '저는 야르릉입니다!!!',
    author: '꾸우',
    date: '6월 15일',
    likeCount: 2,
    commentCount: 1,
    viewCount: 15,
  },
];

const MOCK_RECENT: BoardPost[] = [
  {
    id: '3',
    title: '안녕하세요',
    preview: '저는 야르릉입니다!!!',
    author: '꾸우',
    date: '6월 15일',
    likeCount: 2,
    commentCount: 1,
    viewCount: 15,
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

export default function CommunityListScreen() {
  const insets = useSafeAreaInsets();
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

        <View style={styles.section}>
          <Text style={styles.eyebrow}>POPULAR PICKS</Text>
          <Text style={styles.sectionTitle}>인기 게시물</Text>
          <Text style={styles.sectionSubtitle}>지금 커뮤니티에서 반응이 좋은 이야기를 먼저 만나보세요.</Text>
          <PostListCard posts={MOCK_POPULAR} />
        </View>

        <View style={styles.section}>
          <Text style={styles.eyebrow}>COMMUNITY BOARD</Text>
          <Text style={styles.sectionTitle}>최근 게시물</Text>
          <Text style={styles.sectionSubtitle}>반려생활 속 소소한 기록부터 유용한 팁까지 한눈에 둘러보세요.</Text>
          <PostListCard posts={MOCK_RECENT} />
        </View>
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
