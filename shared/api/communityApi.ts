import { apiClient } from './axios';

// 웹(dodo-frontend)의 커뮤니티 도메인(게시글/댓글/반응) 계약과 동일.

export type ReactionType = 'LIKE' | 'DISLIKE';

export interface BoardListItem {
  boardId: number;
  boardTitle: string;
  boardContentPreview: string;
  thumbnailImageUrl: string | null;
  nickname: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
  modifiedAt: string;
}

export interface GetBoardsParams {
  page: number;
  size?: number;
}

export interface GetBoardsResponse {
  boards: BoardListItem[];
}

/** 커뮤니티 피드 (GET /boards) — 로그인 불필요(공개). 웹도 토큰이 있으면 그냥 같이 보낸다(skipAuthAttach 안 씀). */
export async function getBoards(params: GetBoardsParams): Promise<GetBoardsResponse> {
  const response = await apiClient.get<GetBoardsResponse>('/boards', {
    params: { page: params.page, size: params.size ?? 12 },
  });
  return response.data;
}

export interface BoardDetail {
  boardId: number;
  boardTitle: string;
  boardContent: string;
  imageFileUrls: string[];
  profileUrl: string | null;
  nickname: string;
  likeCount: number;
  dislikeCount: number;
  commentCount?: number;
  viewCount: number;
  boardCreatedAt: string;
  /** 백엔드 실제 필드명 불확실 — 4가지 후보를 방어적으로 확인 (웹과 동일 정책) */
  reactionType?: ReactionType | null;
  myReactionType?: ReactionType | null;
  currentUserReactionType?: ReactionType | null;
  userReactionType?: ReactionType | null;
}

export function getMyReaction(board: BoardDetail): ReactionType | null {
  return board.reactionType ?? board.myReactionType ?? board.currentUserReactionType ?? board.userReactionType ?? null;
}

/** 게시글 상세 (GET /boards/{boardId}) */
export async function getBoardDetail(boardId: number | string): Promise<BoardDetail> {
  const response = await apiClient.get<BoardDetail>(`/boards/${boardId}`);
  return response.data;
}

// 웹도 이 필드들 위치가 불확실해서 author.* / 최상위 둘 다 방어적으로 확인한다 (features/community/ui/BoardDetailContent.tsx 참고).
export interface CommentAuthor {
  userId?: string;
  nickname?: string;
  profileUrl?: string | null;
}

export interface CommentItem {
  commentId: number;
  boardId: number;
  parentCommentId: number | null;
  commentContent: string;
  author?: CommentAuthor;
  userId?: string;
  nickname?: string;
  profileUrl?: string | null;
  createdAt?: string;
  modifiedAt?: string;
  deleted?: boolean;
  isDeleted?: boolean;
}

export function getCommentNickname(comment: CommentItem): string {
  return comment.author?.nickname?.trim() || comment.nickname?.trim() || '알 수 없음';
}

export function getCommentProfileUrl(comment: CommentItem): string | null {
  return comment.author?.profileUrl ?? comment.profileUrl ?? null;
}

export function getCommentTimestamp(comment: CommentItem): string | undefined {
  return comment.modifiedAt ?? comment.createdAt;
}

export function isCommentDeleted(comment: CommentItem): boolean {
  return Boolean(comment.deleted || comment.isDeleted);
}

export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface GetCommentsResponse {
  pageInfo: PageInfo;
  data: CommentItem[];
}

/** 게시글 댓글 목록 (GET /comments/{boardId}) — 오프셋 페이지네이션, 무한스크롤 아님 */
export async function getComments(boardId: number | string, page: number, size = 20): Promise<GetCommentsResponse> {
  const response = await apiClient.get<GetCommentsResponse>(`/comments/${boardId}`, { params: { page, size } });
  return response.data;
}

export interface CreateCommentRequest {
  boardId: number;
  commentContent: string;
  parentCommentId?: number;
}

/** 댓글/답글 등록 (POST /comments) */
export async function createComment(body: CreateCommentRequest): Promise<void> {
  await apiClient.post('/comments', body);
}

/** 댓글 수정 (PATCH /comments/{commentId}) */
export async function updateComment(commentId: number | string, commentContent: string): Promise<void> {
  await apiClient.patch(`/comments/${commentId}`, { commentContent });
}

/** 댓글 삭제 (DELETE /comments/{commentId}) */
export async function deleteComment(commentId: number | string): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}

/** 게시글 반응 최초 등록 (POST /reactions/board) */
export async function createBoardReaction(boardId: number, reactionType: ReactionType): Promise<void> {
  await apiClient.post('/reactions/board', { boardId, reactionType });
}

/** 같은 반응 재클릭 시 취소 (DELETE /reactions/board/{boardId}) */
export async function deleteBoardReaction(boardId: number | string): Promise<void> {
  await apiClient.delete(`/reactions/board/${boardId}`);
}

/** 좋아요↔싫어요 전환 (PATCH /reactions/board/{boardId}) */
export async function updateBoardReaction(boardId: number | string, reactionType: ReactionType): Promise<void> {
  await apiClient.patch(`/reactions/board/${boardId}`, { reactionType });
}

export interface CreateBoardRequest {
  boardTitle: string;
  boardContent: string;
  imageFileUrls: string[];
}

export interface CreateBoardResponse {
  boardId: number;
}

/** 게시글 작성 (POST /boards) */
export async function createBoard(body: CreateBoardRequest): Promise<CreateBoardResponse> {
  const response = await apiClient.post<CreateBoardResponse>('/boards', body);
  return response.data;
}

/** 게시글 수정 (PATCH /boards/{boardId}) */
export async function updateBoard(boardId: number | string, body: CreateBoardRequest): Promise<void> {
  await apiClient.patch(`/boards/${boardId}`, body);
}

/** 게시글 삭제 (DELETE /boards/{boardId}) */
export async function deleteBoard(boardId: number | string): Promise<void> {
  await apiClient.delete(`/boards/${boardId}`);
}

export interface TempSaveBoardRequest {
  boardTitle?: string;
  boardContent?: string;
  imageFileUrl?: string;
  imageFileUrls?: string[];
}

export interface TempSaveBoardResponse {
  sessionKey: string;
}

/** 임시 저장 (POST /boards/temp-save, 수정 중이면 ?boardId= 추가) */
export async function tempSaveBoard(
  body: TempSaveBoardRequest,
  boardId?: number | string,
): Promise<TempSaveBoardResponse> {
  const response = await apiClient.post<TempSaveBoardResponse>('/boards/temp-save', body, {
    params: boardId ? { boardId } : undefined,
  });
  return response.data;
}

/** 임시 저장 불러오기 (GET /boards/temp-save/{sessionKey}) */
export async function getTempSaveBoard(sessionKey: string): Promise<TempSaveBoardRequest> {
  const response = await apiClient.get<TempSaveBoardRequest>(`/boards/temp-save/${sessionKey}`);
  return response.data;
}

export interface GetMyBoardsResponse {
  boards: BoardListItem[];
}

/** 내 게시글 (GET /boards/me) — 응답에 totalPages 없음, length>=size 휴리스틱으로 다음 페이지 여부 판단 */
export async function getMyBoards(page: number, size = 10): Promise<GetMyBoardsResponse> {
  const response = await apiClient.get<GetMyBoardsResponse>('/boards/me', { params: { page, size } });
  return response.data;
}

export interface MyCommentItem {
  commentId: number;
  boardId: number;
  boardTitle: string;
  parentCommentId: number | null;
  commentContent: string;
}

export interface GetMyCommentsResponse {
  pageInfo: PageInfo;
  data: MyCommentItem[];
}

/** 내 댓글 (GET /comments/me) */
export async function getMyComments(page: number, size = 10): Promise<GetMyCommentsResponse> {
  const response = await apiClient.get<GetMyCommentsResponse>('/comments/me', { params: { page, size } });
  return response.data;
}
