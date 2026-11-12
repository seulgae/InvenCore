import { displayPath } from "../../data/inventory";
import "../../styles/ImplementationNotes.css";
import ArchitectureView from "./ArchitectureView";

const fileRole = (path) => {
  if (path.includes("/service/")) return "처리 로직";
  if (path.includes("/controller/")) return "API";
  if (path.includes("/messaging/")) return "이벤트";
  if (path.includes("/cache/")) return "캐시";
  if (path.includes("/repository/") || path.includes("/mapper/"))
    return "데이터 접근";
  if (path.includes("/entity/") || path.includes("/dto/")) return "데이터 모델";
  if (path.includes("/config/")) return "설정";
  return path.endsWith(".java") ? "백엔드" : "화면";
};

export default function ImplementationNotes({ item, onTab, onSource }) {
  const sources = item.sources.map((file, index) => ({
    path: displayPath(file.path),
    index,
  }));
  const priority = [
    "처리 로직",
    "API",
    "이벤트",
    "캐시",
    "데이터 접근",
    "데이터 모델",
    "화면",
    "백엔드",
    "설정",
  ];
  const ordered = [...sources].sort(
    (a, b) =>
      priority.indexOf(fileRole(a.path)) - priority.indexOf(fileRole(b.path)),
  );
  const sourceLink = ({ path, index }) => (
    <button
      className="notes-file"
      key={path}
      onClick={() => onSource(index)}
      title={path}
    >
      <span className="notes-file-icon" aria-hidden="true">
        {path.endsWith(".java") ? "J" : "⌘"}
      </span>
      <span>
        <strong>{path.split("/").pop()}</strong>
        <small>{fileRole(path)}</small>
      </span>
      <span aria-hidden="true">↗</span>
    </button>
  );
  return (
    <div className="implementation-notes">
      <header className="notes-intro">
        <div className="notes-kicker">
          <span>IMPLEMENTATION NOTE</span>
          <span>
            {item.category} / IC {item.number}
          </span>
        </div>
        <h2>{item.summary}</h2>
        {item.description !== item.summary && <p>{item.description}</p>}
        <div className="notes-intro-bottom">
          <div className="notes-tags">
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <button
            className="notes-primary-action"
            onClick={() => onTab("demo")}
          >
            실행 열기 <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <div className="notes-layout">
        <article className="notes-article">
          <section
            className="notes-section"
            aria-labelledby="notes-features-title"
          >
            <div className="notes-section-heading">
              <span className="notes-section-marker" aria-hidden="true">
                01
              </span>
              <h2 id="notes-features-title">핵심 구현</h2>
            </div>
            <div className="notes-feature-grid">
              {item.features.map((feature, index) => (
                <div className="notes-feature" key={feature}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{feature}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="notes-section" aria-labelledby="notes-flow-title">
            <div className="notes-section-heading">
              <span className="notes-section-marker" aria-hidden="true">
                02
              </span>
              <h2 id="notes-flow-title">처리 흐름</h2>
              <button onClick={() => onTab("architecture")}>
                전체 아키텍처 <span aria-hidden="true">↗</span>
              </button>
            </div>
            <ArchitectureView item={item} compact />
          </section>

          <section
            className="notes-section"
            aria-labelledby="notes-limits-title"
          >
            <div className="notes-section-heading">
              <span className="notes-section-marker" aria-hidden="true">
                03
              </span>
              <h2 id="notes-limits-title">실행 조건과 범위</h2>
            </div>
            <ul className="notes-limits">
              {item.caveats.map((note) => (
                <li key={note}>
                  <span aria-hidden="true">i</span>
                  <p>{note}</p>
                </li>
              ))}
            </ul>
          </section>

          <button
            className="notes-reference-link"
            onClick={() => onTab("reference")}
          >
            <span className="notes-reference-icon" aria-hidden="true">
              {"{ }"}
            </span>
            <span>
              <strong>클래스 · 메서드 · 라이브러리</strong>
              <small>실제 구현 코드와 기능별 의존성</small>
            </span>
            <span aria-hidden="true">↗</span>
          </button>
        </article>

        <aside className="notes-sidebar" aria-label="구현 자료">
          <section className="notes-side-section">
            <header>
              <h2>구현 파일</h2>
              <span>{sources.length}</span>
            </header>
            <div>{ordered.slice(0, 6).map(sourceLink)}</div>
            {ordered.length > 6 && (
              <details className="notes-more-files">
                <summary>나머지 {ordered.length - 6}개 파일</summary>
                <div>{ordered.slice(6).map(sourceLink)}</div>
              </details>
            )}
            <button
              className="notes-all-sources"
              onClick={() => onTab("source")}
            >
              소스 탐색기 열기 <span aria-hidden="true">↗</span>
            </button>
          </section>
          <section className="notes-side-section notes-data">
            <h2>데이터 구조</h2>
            <div>
              {item.tables.map((table) => (
                <code key={table}>{table}</code>
              ))}
            </div>
          </section>
          <section className="notes-side-section notes-endpoint">
            <h2>연결 API</h2>
            <code>{item.endpoint}</code>
          </section>
        </aside>
      </div>
    </div>
  );
}
