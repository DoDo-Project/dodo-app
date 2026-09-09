import axios, { type InternalAxiosRequestConfig } from 'axios';

import { apiConfig } from '@/shared/config';
import { refreshAccessToken } from '@/shared/lib/auth/refreshAccessToken';
import * as tokenStorage from '@/shared/lib/auth/tokenStorage';

// 웹(dodo-frontend)의 shared/api/axios.ts와 동일한 커스텀 config 확장.
declare module 'axios' {
  export interface AxiosRequestConfig {
    /** true면 Authorization 미첨부·선제 refresh 생략 (소셜 로그인 등) */
    skipAuthAttach?: boolean;
    /** true면 401 시 재발급·재시도를 하지 않음 */
    skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function isPublicAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('/auth/social-login') || url.includes('/auth/reissue');
}

export const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function attachAccessToken(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  if (config.skipAuthAttach || isPublicAuthPath(config.url)) {
    if (config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  }

  let accessToken = await tokenStorage.getAccessToken();

  if (accessToken && !config.skipAuthRefresh && (await tokenStorage.isAccessTokenExpiringSoon())) {
    accessToken = (await refreshAccessToken()) ?? accessToken;
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
}

apiClient.interceptors.request.use(
  async (config) => attachAccessToken(config),
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      !originalRequest ||
      originalRequest.skipAuthRefresh ||
      originalRequest._retry ||
      error.response?.status !== 401
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
