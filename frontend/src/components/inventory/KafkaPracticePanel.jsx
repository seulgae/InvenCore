import { useState } from "react";
import { Link } from "react-router-dom";
import { inventory } from "../../data/inventory";
import { kafkaTerms, kafkaSources, kafkaExercises } from "../../data/kafkaLearning";
import "../../styles/KafkaPractice.css";

/** Kafka 학습 과제와 용어, 구현 검사 결과를 표시합니다. */
export default function KafkaPracticePanel({
  implementation,
  onImplementation,
  report,
  onCheck,
  pending,
}) {
  const [search, setSearch] = useState("");
  const sourceIndex = inventory
    .find((item) => item.id === "kafka-lab")
    .sources.findIndex((file) => file.path.endsWith("UserKafkaCode.java"));
  const filtered = kafkaTerms.filter((term) =>
    `${term.name} ${term.ko} ${term.game} ${term.meaning}`
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  );
  return (
    <section className="kafka-practice" aria-label="Java 구현 실습과 Kafka 용어">
      <header>
        <span>BUILD IT YOURSELF</span>
        <h2>내 Java 코드로 공장 돌리기</h2>
        <p>IntelliJ에서 TODO 3곳을 구현하고, 테스트와 검사를 통과한 뒤 같은 게임에 적용하세요.</p>
      </header>
      <div className="practice-modes" aria-label="게임 구현 선택">
        <button
          aria-pressed={implementation === "REFERENCE"}
          disabled={pending}
          onClick={() => onImplementation("REFERENCE")}
        >
          완성 예제로 플레이
        </button>
        <button
          aria-pressed={implementation === "LEARNER"}
          disabled={pending || !report?.ready}
          onClick={() => onImplementation("LEARNER")}
        >
          내 Java 코드로 플레이
        </button>
        <span>{implementation === "LEARNER" ? "UserKafkaCode 호출" : "참고 구현 호출"}</span>
      </div>
      <details className="practice-tasks" open>
        <summary>직접 구현할 TODO 3개</summary>
        <div className="practice-file">
          <code>
            backend/src/main/java/com/inven/core/backend/api/orderlab/practice/UserKafkaCode.java
          </code>
          <Link to={`/inventory/kafka-lab?tab=source&file=${Math.max(0, sourceIndex)}`}>
            TODO 소스 보기 ↗
          </Link>
        </div>
        <div className="practice-task-grid">
          {kafkaExercises.map((lesson, index) => {
            const check = report?.checks.find((check) => check.id === lesson.id);
            return (
              <article key={lesson.id}>
                <header>
                  <span>TODO 0{index + 1}</span>
                  <b className={check?.passed ? "passed" : ""}>
                    {check ? (check.passed ? "검사 통과" : "구현 필요") : "미검사"}
                  </b>
                </header>
                <h3>{lesson.title}</h3>
                <code>{lesson.method}(…)</code>
                <p>{lesson.rule}</p>
                <details>
                  <summary>힌트</summary>
                  <p>{lesson.hint}</p>
                </details>
                <p className="practice-observe">확인할 결과 · {lesson.observe}</p>
                {check && <p className="practice-check-detail">{check.detail}</p>}
              </article>
            );
          })}
        </div>
        <div className="practice-steps">
          <p>
            <strong>1.</strong> IntelliJ에서 위 파일의 TODO를 작성합니다. 이 화면의 소스 보기는 읽기
            전용입니다.
          </p>
          <p>
            <strong>2.</strong> 프로젝트 루트 터미널에서 학습 테스트를 실행합니다.
          </p>
          <pre>
            <code>
              {
                '.\\backend\\gradlew.bat -p backend test --tests "*OrderLabPracticeContractTests" -PorderLabPractice'
              }
            </code>
          </pre>
          <p>
            <strong>3.</strong> 백엔드를 다시 빌드·실행한 뒤 아래 검사 버튼을 누르고{" "}
            <strong>내 Java 코드로 플레이</strong>를 선택합니다.
          </p>
        </div>
        <div className="practice-check-actions">
          <button onClick={onCheck} disabled={pending}>
            반영된 내 코드 검사
          </button>
          <span role="status">
            {report
              ? report.ready
                ? "기본 계약 검사 통과 · 내 코드 모드 사용 가능"
                : "TODO를 채우면 내 코드 모드를 사용할 수 있습니다."
              : "검사 버튼으로 현재 서버에 반영된 코드를 확인하세요."}
          </span>
        </div>
        <p className="practice-disclosure">
          검사는 기본 입력에 대한 계약 검사입니다. 정답 전체를 증명하지 않습니다. 웹에서 코드를
          컴파일하거나 실행하지 않으며, 내 코드 모드만 작성한 메서드를 사용합니다.
        </p>
      </details>
      <details className="practice-glossary">
        <summary>게임으로 이해하는 Kafka 용어 사전 · {kafkaTerms.length}개</summary>
        <label>
          용어 찾기
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="오프셋, 키, 커밋, 재처리…"
          />
        </label>
        <div className="practice-term-list">
          {filtered.map((term) => (
            <article key={term.name}>
              <header>
                <h3>{term.name}</h3>
                <span>{term.ko}</span>
              </header>
              <strong>{term.game}</strong>
              <p>{term.meaning}</p>
              <p className="practice-term-caution">주의 · {term.caution}</p>
            </article>
          ))}
        </div>
        {!filtered.length && <p>검색된 용어가 없습니다.</p>}
        <nav className="practice-sources" aria-label="Kafka 공식 참고 자료">
          {kafkaSources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.title} ↗
            </a>
          ))}
        </nav>
      </details>
    </section>
  );
}
