const { withProjectBuildGradle } = require('@expo/config-plugins');

// @mj-studio/react-native-naver-map의 config plugin이 AndroidManifest/Info.plist는
// 채워주지만, 네이버 지도 SDK(com.naver.maps:map-sdk)가 올라가 있는 전용 Maven
// 저장소는 넣어주지 않는다. google()/mavenCentral()에는 없는 패키지라 이걸 빠뜨리면
// "Could not find com.naver.maps:map-sdk" 에러로 빌드가 실패한다.
const NAVER_MAVEN_URL = 'https://repository.map.naver.com/archive/maven';

module.exports = function withNaverMapsRepository(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy' && !config.modResults.contents.includes(NAVER_MAVEN_URL)) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*{\s*repositories\s*{/,
        (match) => `${match}\n        maven { url '${NAVER_MAVEN_URL}' }`,
      );
    }
    return config;
  });
};
