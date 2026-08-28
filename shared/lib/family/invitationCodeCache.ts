import AsyncStorage from '@react-native-async-storage/async-storage';

// 웹과 동일: "현재 초대 코드 조회" API가 없어 발급된 코드를 로컬에 캐시해 재사용한다.
// 캐시가 사라지면(앱 재설치 등) 만료 전이라도 복구할 수 없다 — 웹과 동일한 제약.

type CachedCode = { code: string; expiresAt: number };

function key(petId: number | string) {
  return `dodo.invitationCode.${petId}`;
}

export async function saveInvitationCode(
  petId: number | string,
  code: string,
  expiresInSeconds: number,
): Promise<void> {
  const cached: CachedCode = { code, expiresAt: Date.now() + expiresInSeconds * 1000 };
  await AsyncStorage.setItem(key(petId), JSON.stringify(cached));
}

export async function getInvitationCode(petId: number | string): Promise<CachedCode | null> {
  const raw = await AsyncStorage.getItem(key(petId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedCode;
    if (parsed.expiresAt <= Date.now()) {
      await AsyncStorage.removeItem(key(petId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
