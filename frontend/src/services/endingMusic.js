import endingBgmUrl from "../assets/ending-bgm.m4a";

export { endingBgmUrl };

// The persistent player survives the popup -> credits route change.
// Start play() inside the original click so the browser receives a user gesture.
export function playEndingMusic({ restart = false } = {}) {
  const audio = document.getElementById("ending-bgm");
  if (!audio) return Promise.resolve(false);
  if (restart) {
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 0;
  }
  return audio.play().then(() => true).catch(() => false);
}

export function stopEndingMusic() {
  const audio = document.getElementById("ending-bgm");
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0;
  audio.muted = false;
}
