export default function ArchitectureView({ item, compact = false }) {
  return (
    <div className={`architecture-view ${compact ? "compact" : ""}`}>
      <div className="architecture-label">
        <span>REQUEST → PROCESS → STORE</span>
        <span>{item.steps.length} NODES</span>
      </div>
      <ol className="architecture-flow">
        {item.steps.map((step, index) => (
          <li key={step.name}>
            <div className="architecture-node">
              <div>
                <span>{step.layer}</span>
                <small>{String(index + 1).padStart(2, "0")}</small>
              </div>
              <strong>{step.name}</strong>
              <p>{step.description}</p>
            </div>
            {index < item.steps.length - 1 && (
              <span className="architecture-arrow" aria-hidden="true">
                →
              </span>
            )}
          </li>
        ))}
      </ol>
      {!compact && (
        <>
          <div className="architecture-bottom">
            <section>
              <h3>DATA MODEL</h3>
              {item.tables.map((table) => (
                <div className="model-row" key={table}>
                  <span>▤</span>
                  <code>{table}</code>
                  <small>JPA</small>
                </div>
              ))}
            </section>
            <section>
              <h3>RUNTIME</h3>
              <dl>
                <div>
                  <dt>Client</dt>
                  <dd>React → Axios → /api</dd>
                </div>
                <div>
                  <dt>Server</dt>
                  <dd>Spring Boot · Java 17</dd>
                </div>
                <div>
                  <dt>Database</dt>
                  <dd>기본 H2 메모리 / JPA</dd>
                </div>
                {item.id === "capacity" && (
                  <div>
                    <dt>Remote</dt>
                    <dd>Linux · SSH key authentication</dd>
                  </div>
                )}
                {item.id === "files" && (
                  <div>
                    <dt>Storage</dt>
                    <dd>서버 로컬 업로드 디렉터리</dd>
                  </div>
                )}
              </dl>
            </section>
          </div>
          <p className="architecture-footnote">
            현재 코드의 호출 흐름을 표현한 구조도입니다. DB와 실행 환경은 배포
            설정에 따라 달라집니다.
          </p>
        </>
      )}
    </div>
  );
}
