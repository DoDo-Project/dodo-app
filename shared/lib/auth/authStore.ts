import { create } from 'zustand';

import * as tokenStorage from './tokenStorage';
import type { AuthProfile, TokenPair } from './tokenStorage';

type AuthState = {
  /** 앱 시작 시 SecureStore/AsyncStorage에서 세션 복원이 끝났는지 여부 */
  isHydrated: boolean;
  isAuthenticated: boolean;
  profile: AuthProfile;
  hydrate: () => Promise<void>;
  setSession: (params: { tokens: TokenPair; profile: AuthProfile }) => Promise<void>;
  updateProfile: (profile: Partial<AuthProfile>) => Promise<void>;
  clearSession: () => Promise<void>;
};

const EMPTY_PROFILE: AuthProfile = {
  profileUrl: null,
  nickname: null,
  region: null,
  notificationEnabled: false,
};

// 웹의 window.dispatchEvent(new Event('dodo:auth-state-change'))를 대체.
// 이 store를 구독하는 컴포넌트는 setSession/clearSession 호출 시 자동으로 리렌더된다.
export const useAuthStore = create<AuthState>((set) => ({
  isHydrated: false,
  isAuthenticated: false,
  profile: EMPTY_PROFILE,

  hydrate: async () => {
    const [accessToken, profile] = await Promise.all([tokenStorage.getAccessToken(), tokenStorage.getProfile()]);
    set({ isHydrated: true, isAuthenticated: !!accessToken, profile });
  },

  setSession: async ({ tokens, profile }) => {
    await Promise.all([tokenStorage.saveTokens(tokens), tokenStorage.saveProfile(profile)]);
    set({ isAuthenticated: true, profile });
  },

  updateProfile: async (partial) => {
    set((state) => {
      const nextProfile = { ...state.profile, ...partial };
      tokenStorage.saveProfile(nextProfile);
      return { profile: nextProfile };
    });
  },

  clearSession: async () => {
    await Promise.all([tokenStorage.clearTokens(), tokenStorage.clearProfile()]);
    set({ isAuthenticated: false, profile: EMPTY_PROFILE });
  },
}));
