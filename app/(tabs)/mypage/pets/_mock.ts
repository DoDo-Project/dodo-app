// TODO(이슈4): GET /pets/list, GET /pets/{petId} 연동 후 mock 제거
export type Pet = {
  id: string;
  name: string;
  gender: 'F' | 'M' | null;
  birthDate: string;
  ageLabel: string;
  species: string;
  breed: string;
  deviceId: string;
  baselineHeartRate: number;
  registrationNumber: string | null;
};

export const MOCK_PETS: Pet[] = [
  {
    id: 'sundubu',
    name: '순두부',
    gender: 'F',
    birthDate: '2024. 12. 10',
    ageLabel: '만 1세',
    species: '강아지',
    breed: '말티즈',
    deviceId: 'ABC123678',
    baselineHeartRate: 87,
    registrationNumber: null,
  },
  {
    id: 'godeungeo',
    name: '고등어',
    gender: 'M',
    birthDate: '2025. 01. 07',
    ageLabel: '만 1세',
    species: '고양이',
    breed: '코리안숏헤어',
    deviceId: 'DEF456789',
    baselineHeartRate: 92,
    registrationNumber: null,
  },
  {
    id: 'maltese',
    name: '말티티',
    gender: 'F',
    birthDate: '2026. 06. 02',
    ageLabel: '만 0세',
    species: '강아지',
    breed: '말티즈',
    deviceId: 'GHI789012',
    baselineHeartRate: 90,
    registrationNumber: null,
  },
  {
    id: 'pold',
    name: '폴드',
    gender: null,
    birthDate: '2024. 06. 04',
    ageLabel: '만 2세',
    species: '고양이',
    breed: '스코티시폴드',
    deviceId: 'JKL012345',
    baselineHeartRate: 95,
    registrationNumber: null,
  },
  {
    id: 'puchi',
    name: '푸치',
    gender: 'M',
    birthDate: '2026. 06. 01',
    ageLabel: '만 0세',
    species: '강아지',
    breed: '말티즈',
    deviceId: 'MNO345678',
    baselineHeartRate: 88,
    registrationNumber: null,
  },
];

export type WeightRecord = {
  id: string;
  weightKg: number;
  measuredAt: string;
};

export const MOCK_WEIGHT_RECORDS: Record<string, WeightRecord[]> = {
  sundubu: [
    { id: 'w1', weightKg: 5.6, measuredAt: '2026. 05. 08' },
    { id: 'w2', weightKg: 5.4, measuredAt: '2026. 02. 08' },
    { id: 'w3', weightKg: 5.2, measuredAt: '2026. 01. 08' },
  ],
};

export const NOTE_CATEGORIES = ['알레르기', '병원', '약물', '음식', '행동', '증상', '기타'] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export type SignificantNote = {
  id: string;
  tag: NoteCategory;
  date: string;
  content: string;
};

export const MOCK_NOTES: Record<string, SignificantNote[]> = {
  sundubu: [
    { id: 'n1', tag: '약물', date: '2026-07-08', content: '감기약 복용' },
    { id: 'n2', tag: '증상', date: '2026-07-08', content: '구토를 안함' },
    { id: 'n3', tag: '음식', date: '2026-07-08', content: '두부를 못 먹음' },
    { id: 'n4', tag: '알레르기', date: '2026-07-08', content: '생선 알레르기 있음' },
  ],
};
