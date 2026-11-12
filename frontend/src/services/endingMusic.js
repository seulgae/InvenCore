import endingBgmUrl from "../assets/ending-bgm.m4a";

export { endingBgmUrl };

// 공통 레이아웃의 플레이어를 사용해 팝업에서 크레딧으로 이동해도 음악을 유지합니다.
// 브라우저의 재생 허용을 받을 수 있도록 최초 클릭 동작 안에서 play()를 호출합니다.

/** 엔딩 BGM을 준비하고 재생합니다. 브라우저의 자동 재생 제한 시 실패를 반환합니다. */
export function playEndingMusic({ restart = false } = {}) {
  const audio = document.getElementById("ending-bgm");
  if (!audio) return Promise.resolve(false);
  if (restart) {
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 0;
  }
  return audio
    .play()
    .then(() => true)
    .catch(() => false);
}

/** 엔딩 BGM을 중지하고 재생 위치를 처음으로 되돌립니다. */
export function stopEndingMusic() {
  const audio = document.getElementById("ending-bgm");
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0;
  audio.muted = false;
}
