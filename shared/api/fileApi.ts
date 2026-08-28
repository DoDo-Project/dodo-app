import type { AxiosRequestConfig } from 'axios';

import { apiClient } from './axios';

// 웹(dodo-frontend)과 동일하게 이미지 업로드는 공용 엔드포인트 하나만 사용한다 (presigned URL 방식 아님).

export interface UploadFilesResponse {
  imageUrls: string[];
}

export interface LocalFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * 이미지 업로드 (POST /files/upload)
 * @param authToken 회원가입 중(registrationToken)처럼 정식 accessToken이 아직 없을 때 넘긴다.
 *
 * 주의: Content-Type을 'multipart/form-data'로 직접 지정하면 안 된다 — boundary 파라미터 없이
 * 헤더를 고정해버리면 RN의 네트워킹 레이어가 FormData를 보고 자동으로 boundary를 붙여주는 동작을
 * 막아버려서, 서버가 멀티파트 바디를 파싱하지 못한다(업로드가 통째로 실패하는 원인). Content-Type은
 * 아예 지정하지 않고 axios/RN이 FormData를 보고 알아서 올바른 boundary까지 설정하게 둬야 한다.
 */
export async function uploadFiles(files: LocalFile[], authToken?: string): Promise<UploadFilesResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  });

  // apiClient 인스턴스 기본 헤더가 Content-Type: application/json으로 고정돼있어서, 명시적으로
  // undefined를 줘서 지워야 axios/RN이 FormData를 보고 boundary 포함한 헤더를 자동으로 붙여준다.
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': undefined,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  };

  const response = await apiClient.post<UploadFilesResponse>('/files/upload', formData, config);
  return response.data;
}
