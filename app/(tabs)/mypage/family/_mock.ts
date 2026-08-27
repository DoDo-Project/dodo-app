// TODO(이슈4): GET /pets/family/* 연동 후 mock 제거
export type FamilyMember = {
  id: string;
  name: string;
};

export const MOCK_FAMILY_MEMBERS: Record<string, FamilyMember[]> = {
  sundubu: [{ id: 'me', name: '조수빈' }],
};

export type SentRequestStatus = '승인 대기' | '승인됨' | '거절됨';

export type SentRequest = {
  id: string;
  petName: string;
  status: SentRequestStatus;
  message: string;
  sentAt: string;
};

export const MOCK_SENT_REQUESTS: SentRequest[] = [
  {
    id: 'sr1',
    petName: '보라',
    status: '거절됨',
    message: '가족 신청을 보낸 반려동물이에요.',
    sentAt: '2026-07-08 15:11',
  },
];

export type ReceivedRequestStatus = '승인 대기' | '거절됨';

export type ReceivedRequest = {
  id: string;
  petName: string;
  status: ReceivedRequestStatus;
  sentAt: string;
};

export const MOCK_RECEIVED_REQUESTS: ReceivedRequest[] = [];

export type BlockedEntry = {
  id: string;
  petName: string;
};

export const MOCK_BLOCKED: BlockedEntry[] = [];
