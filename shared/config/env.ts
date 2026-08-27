const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
// TODO: 네이버 로그인 백엔드 배포되면 필수값으로 승격하고 아래 throw 추가
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '';

if (!API_BASE_URL) {
  throw new Error('Missing env: EXPO_PUBLIC_API_BASE_URL');
}
if (!GOOGLE_CLIENT_ID) {
  throw new Error('Missing env: EXPO_PUBLIC_GOOGLE_CLIENT_ID');
}

export const env = {
  API_BASE_URL,
  GOOGLE_CLIENT_ID,
  NAVER_CLIENT_ID,
};
