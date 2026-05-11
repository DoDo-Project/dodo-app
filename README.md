## ✨ 앱 주요 기능 (Key App Features)

- **✅ 사용자 및 펫 정보 관리**
  > 회원가입/로그인 화면, 소셜 로그인(OAuth2) 연동 <br>
  > 펫 등록, 펫 정보 수정, 건강 기록 확인 UI 제공

- **✅ 산책 경로 및 실시간 위치 시각화**
  > 지도 기반 산책 경로 표시 및 실시간 위치 업데이트 <br>
  > 안전 구역(Geo-fencing) 이탈 감지 및 알림 UI 제공

- **✅ 활동 및 건강 통계 확인**
  > 산책 기록, 활동량, 심박수, 수면 패턴 등 건강 데이터 시각화 <br>
  > 서버 API를 통해 통계 데이터를 조회하고 앱 화면에 표시

- **✅ 커뮤니티 기능**
  > 게시글 목록, 상세보기, 댓글 작성 UI 제공 <br>
  > 인기 게시글 및 검색 기능을 통해 사용자 간 정보 공유 지원

- **✅ 푸시 알림**
  > 활동 목표 달성, 지오펜싱 이탈, 댓글/답글 알림 등 앱 푸시 알림 처리 <br>
  > FCM 기반 알림 수신 및 사용자 알림 화면 제공

- **✅ 모바일 사용성 최적화**
  > React Native 기반의 Android/iOS 앱 화면 구성 <br>
  > 비동기 데이터 로딩, 캐싱, 로딩/에러 상태 처리를 통한 사용자 경험 개선

<br>

## ⚙️ 기술 스택 (Tech Stack)

<div align="center">

### App Framework & Language
<p>
<img src="https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white">
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
</p>

### Navigation & UI
<p>
<img src="https://img.shields.io/badge/Expo%20Router-000020?style=for-the-badge&logo=expo&logoColor=white">
<img src="https://img.shields.io/badge/React%20Navigation-6B52AE?style=for-the-badge&logo=react&logoColor=white">
</p>

### Data Management & Real-time
<p>
<img src="https://img.shields.io/badge/Zustand-433E38?style=for-the-badge&logo=zustand&logoColor=white">
<img src="https://img.shields.io/badge/TanStack%20Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white">
<img src="https://img.shields.io/badge/WebSocket-0082C9?style=for-the-badge&logoColor=white">
<img src="https://img.shields.io/badge/FCM-FCA121?style=for-the-badge&logo=firebase&logoColor=white">
</p>

### Code Quality
<p>
<img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white">
<img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black">
<img src="https://img.shields.io/badge/Husky-000000?style=for-the-badge&logo=git&logoColor=white">
</p>

</div>

<br>

## 🤖 앱 아키텍처 (App System Architecture)

React Native 앱을 중심으로 사용자 입력, 화면 상태 관리, 서버 API 요청, 실시간 데이터 수신 흐름을 구성합니다.

사용자 입력 → React Native/TypeScript 기반 화면 처리 → API 호출 → Spring Boot 서버 → 데이터 조회 및 처리 → WebSocket/FCM 실시간 데이터 수신 → 앱 UI 업데이트

<br>

## 🤝 Conventions

우리 프로젝트는 원활한 협업을 위해 아래와 같은 규칙을 따릅니다.

- **[Commit Convention](./.github/COMMIT_CONVENTION.md)**

<br>

## 📊 앱 참고자료 출처

<br>

## 💁‍♂️ 팀원 소개 (Team Members)

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/sooloin">
      <img src="https://github.com/sooloin.png" alt="조수빈 프로필" width="150" height="150"/><br>
      <b>조수빈</b>
    </td>
    <td align="center">
      <a href="https://github.com/WhiteBin-bin">
      <img src="https://github.com/WhiteBin-bin.png" alt="백현빈 프로필" width="150" height="150"/><br>
      <b>백현빈</b>
    </td>
  </tr>
</table>
