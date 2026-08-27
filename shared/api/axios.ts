import axios, { type InternalAxiosRequestConfig } from 'axios';

import { apiConfig } from '@/shared/config';
import { refreshAccessToken } from '@/shared/lib/auth/refreshAccessToken';
import * as tokenStorage from '@/shared/lib/auth/tokenStorage';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    let accessToken = await tokenStorage.getAccessToken();

    // 만료 60초 전이면 요청 전에 미리 갱신 (웹의 ACCESS_TOKEN_REFRESH_BUFFER_MS와 동일한 전략)
    if (accessToken && (await tokenStorage.isAccessTokenExpiringSoon())) {
      accessToken = (await refreshAccessToken()) ?? accessToken;
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // 사전 갱신을 놓친 경우(서버 측 강제 만료 등)를 대비한 사후 처리
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
