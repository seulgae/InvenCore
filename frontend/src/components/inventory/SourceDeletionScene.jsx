import { useEffect, useState } from "react";
import { displayPath, inventory } from "../../data/inventory";
import { stopEndingMusic } from "../../services/endingMusic";
import "../../styles/SourceDeletion.css";

// 공개 소스 목록의 경로로 연출만 표시하며, 파일 접근·삭제 API는 호출하지 않습니다.
const files = [
  ...new Set(inventory.flatMap((item) => item.sources.map((source) => displayPath(source.path)))),
].sort();
const DURATION = 8000;
const DELETION_DURATION = 6200;

/** 가상의 소스 삭제 연출을 표시합니다. 실제 파일은 삭제하지 않습니다. */
export default function SourceDeletionScene({ onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const count = Math.min(
    files.length,
    Math.floor(Math.pow(Math.min(elapsed / DELETION_DURATION, 1), 0.7) * files.length),
  );
  const finished = count === files.length;
  const percent = Math.round((count / files.length) * 100);
  const visibleFiles = files.slice(Math.max(0, count - 12), count);

  useEffect(() => {
    const started = Date.now();
    const tick = window.setInterval(() => setElapsed(Date.now() - started), 80);
    const finish = window.setTimeout(onComplete, DURATION);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(finish);
      stopEndingMusic();
    };
  }, [onComplete]);

  return (
    <main
      className={`source-deletion ${finished ? "is-complete" : ""}`}
      aria-labelledby="source-deletion-title"
    >
      <div className="source-deletion-glow" aria-hidden="true" />
      <section className="source-deletion-terminal">
        <header>
          <span>
            <i />
            <i />
            <i />
          </span>
          <span>InvenCore — source cleanup</span>
          <span>⌘</span>
        </header>
        <div className="source-deletion-body">
          <p className="source-deletion-command">
            <span>➜</span> InvenCore <span>source / purge</span>
          </p>
          <h1 id="source-deletion-title">
            {finished ? "소스코드를 찾을 수 없습니다." : "프로젝트 소스 삭제 중…"}
          </h1>
          <p className="source-deletion-caption">
            {finished ? "PROJECT_NOT_FOUND" : "Removing source files and implementation records"}
          </p>
          <div className="source-deletion-log" aria-hidden="true">
            {visibleFiles.map((file) => (
              <div key={file}>
                <span>DELETED</span>
                <code>{file}</code>
                <span>✓</span>
              </div>
            ))}
            {!finished && <span className="source-deletion-cursor">▋</span>}
          </div>
          <div
            className="source-deletion-progress"
            role="progressbar"
            aria-label="소스 삭제 연출 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <footer>
            <span>
              {String(count).padStart(3, "0")} / {files.length} FILES REMOVED
            </span>
            <strong>{percent}%</strong>
          </footer>
          <p className="source-deletion-result" role="status">
            {finished ? "남은 소스 파일 0개. 모든 작업이 종료되었습니다." : " "}
          </p>
        </div>
      </section>
      <div className="source-deletion-blackout" aria-hidden="true" />
    </main>
  );
}
