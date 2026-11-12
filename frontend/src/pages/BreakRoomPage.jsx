import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/BreakRoom.css";
import { playEndingMusic, stopEndingMusic } from "../services/endingMusic";
import SourceDeletionScene from "../components/inventory/SourceDeletionScene";

const credits = [
  { title: "A FILM BY ONE PERSISTENT PERSON", roles: ["감독", "기획", "설계", "각본"] },
  { title: "FROM THE FIRST LINE TO THE LAST COMMIT", roles: ["백엔드 개발", "프론트엔드 개발", "데이터베이스 설계", "API 제작", "UI 디자인", "배포 및 운영"] },
  { title: "THE WORK NO ONE SAW", roles: ["버그 최초 발견", "같은 버그 재발견", "새벽 로그 해독", "무한 디버깅", "빌드 성공 기원", "마지막 커밋 후 다시 수정"] },
  { title: "A VERY SPECIAL PRODUCTION TEAM", roles: ["커피 만든사람", "멘탈 유지보수", "자기소개서 각색", "면접 예상 질문 수집", "불합격 메일 견디기", "그래도 다시 지원하기"] },
  { title: "SPECIAL THANKS", roles: ["어제도 포기하지 않은 사람", "오늘도 의자에 앉은 사람", "내일의 자신을 믿는 사람", "이 모든 장면의 주인공"] },
];

const taehyungRoles = new Set(["감독", "기획", "설계", "각본", "커피 만든사람", "오늘도 의자에 앉은 사람", "불합격 메일 견디기"]);

export default function BreakRoomPage() {
  const [deleting, setDeleting] = useState(true);
  const finishDeletion = useCallback(() => setDeleting(false), []);
  return deleting ? <SourceDeletionScene onComplete={finishDeletion} /> : <EndingCredits />;
}

function EndingCredits() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || "/";
  const [musicBlocked, setMusicBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    let active = true;
    const started = Date.now();
    void playEndingMusic({ restart: true }).then((playing) => {
      if (active) setMusicBlocked(!playing);
    });
    const fade = window.setInterval(() => {
      const audio = document.getElementById("ending-bgm");
      if (!audio) return;
      const elapsed = Date.now() - started;
      audio.volume = 0.6 * Math.max(0, Math.min(1, elapsed / 1500, (60_000 - elapsed) / 4000));
    }, 100);
    const timer = window.setTimeout(() => navigate(returnTo, { replace: true }), 60_000);
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.clearInterval(fade);
      stopEndingMusic();
    };
  }, [navigate, returnTo]);
  const toggleMusic = async () => {
    const audio = document.getElementById("ending-bgm");
    if (!audio) return;
    if (musicBlocked) {
      audio.muted = false;
      setMuted(false);
      setMusicBlocked(!(await playEndingMusic()));
    } else {
      audio.muted = !audio.muted;
      setMuted(audio.muted);
    }
  };
  return <main className="cinema-ending" aria-label="취업 준비 엔딩 크레딧">
    <button className="cinema-sound" onClick={toggleMusic} aria-label={musicBlocked ? "BGM 재생" : muted ? "BGM 소리 켜기" : "BGM 소리 끄기"} aria-pressed={!musicBlocked && !muted}>
      <span aria-hidden="true">{musicBlocked ? "▶" : muted ? "♪ ×" : "♪"}</span>{musicBlocked && <span>BGM 재생</span>}
    </button>
    <div className="cinema-ambient" aria-hidden="true" />
    <div className="cinema-grain" aria-hidden="true" />
    <header className="cinema-intro">
      <span className="cinema-kicker">TO THE PERSON WHO KEPT GOING</span>
      <h1>오늘도 취준하느라<br /><span>고생하셨습니다.</span></h1>
      <p>당신이 버텨온 모든 날에.</p>
      <span className="cinema-intro-end">END</span>
    </header>
    <div className="cinema-credits-window">
      <div className="cinema-roll">
        <p className="cinema-roll-dedication">오늘도 취준하느라 고생하셨습니다.</p>
        <div className="cinema-film-title"><span>AN INVENCORE ORIGINAL</span><h2>끝까지, 나답게.</h2><p>A STORY STILL BEING WRITTEN</p></div>
        {credits.map((group) => <section className="cinema-credit-group" key={group.title} aria-label={group.title}>
          <h3>{group.title}</h3>
          <dl>{group.roles.map((role) => <div className="cinema-credit-row" key={role}><dt>{role}</dt><dd>{taehyungRoles.has(role) ? "길태형" : "ChatGPT"}</dd></div>)}</dl>
        </section>)}
        <section className="cinema-credit-note"><span>AND FINALLY</span><h2>수고했어, 정말.</h2><p>아직 오지 않은 좋은 소식보다<br />여기까지 온 당신이 먼저입니다.</p></section>
        <div className="cinema-roll-end"><span>THE END</span><p>다음 장면의 주인공도, 길태형.</p></div>
      </div>
    </div>
    <footer className="cinema-closing"><span>END</span><p>당신의 다음 장면을 응원합니다.</p></footer>
    <div className="cinema-vignette" aria-hidden="true" />
    <div className="cinema-letterbox cinema-letterbox-top" aria-hidden="true" />
    <div className="cinema-letterbox cinema-letterbox-bottom" aria-hidden="true" />
  </main>;
}
