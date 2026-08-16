import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { DodoColors } from '@/constants/theme';

export type BoardPost = {
  id: string;
  title: string;
  preview: string;
  author: string;
  date: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
};

export function PostRow({ post }: { post: BoardPost }) {
  return (
    <Link href={{ pathname: '/(tabs)/community/[boardId]', params: { boardId: post.id } }} asChild>
      <TouchableOpacity style={styles.postRow}>
        <View style={styles.postTextCol}>
          <Text style={styles.postTitle} numberOfLines={1}>
            {post.title}
          </Text>
          <Text style={styles.postPreview} numberOfLines={1}>
            {post.preview}
          </Text>
          <View style={styles.postMetaRow}>
            <Ionicons name="thumbs-up" size={12} color={DodoColors.fenceOutside} />
            <Text style={styles.postMetaText}>{post.likeCount}</Text>
            <Ionicons
              name="chatbubble-outline"
              size={12}
              color={DodoColors.fenceIdleLabel}
              style={styles.metaIconGap}
            />
            <Text style={styles.postMetaText}>{post.commentCount}</Text>
            <Text style={styles.postMetaDivider}>|</Text>
            <Text style={styles.postMetaText}>{post.date}</Text>
            <Text style={styles.postMetaDivider}>|</Text>
            <Text style={styles.postMetaText}>{post.author}</Text>
            <Text style={styles.postMetaDivider}>|</Text>
            <Text style={styles.postMetaText}>조회 {post.viewCount}</Text>
          </View>
        </View>
        <View style={styles.postThumbnail}>
          <Ionicons name="image-outline" size={22} color={DodoColors.fenceIdleLabel} />
        </View>
      </TouchableOpacity>
    </Link>
  );
}

export function PostListCard({ posts }: { posts: BoardPost[] }) {
  return (
    <View style={styles.card}>
      {posts.map((post, index) => (
        <View key={post.id}>
          <PostRow post={post} />
          {index < posts.length - 1 && <View style={styles.postDivider} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DodoColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DodoColors.border,
    paddingHorizontal: 16,
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  postTextCol: {
    flex: 1,
    gap: 4,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DodoColors.textPrimary,
  },
  postPreview: {
    fontSize: 13,
    color: DodoColors.textSecondary,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  postMetaText: {
    fontSize: 11,
    color: DodoColors.fenceIdleLabel,
    marginLeft: 3,
  },
  postMetaDivider: {
    fontSize: 11,
    color: DodoColors.border,
    marginHorizontal: 6,
  },
  metaIconGap: {
    marginLeft: 8,
  },
  postThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: DodoColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postDivider: {
    height: 1,
    backgroundColor: DodoColors.background,
  },
});
