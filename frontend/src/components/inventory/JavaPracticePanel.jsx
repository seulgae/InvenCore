import { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/axios";
import { inventoryPractice } from "../../data/inventoryPractice";
import "../../styles/JavaPractice.css";

/** 카드별 Java TODO 위치와 기본 계약 검사 결과를 표시합니다. */
export default function JavaPracticePanel({ item }) {
  const exercise = inventoryPractice[item.id];
  const [report, setReport] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!exercise) return null;
  const fileIndex = item.sources.findIndex((source) => source.path === exercise.path);

  /** 선택한 카드의 실습 검사를 요청하고 결과와 실행 상태를 갱신합니다. */
  const inspect = async () => {
    setPending(true);
    setError("");
    setReport(null);
    try {
      const { data } = await apiClient.post(`/practice/${item.id}/check`);
      setReport(data);
    } catch (e) {
      setError(
        e.response?.data?.message || "검사에 연결하지 못했습니다. 백엔드 실행 상태를 확인하세요.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="java-practice" aria-label="직접 구현 과제">
      <header>
        <div>
          <span className="java-practice-label">JAVA WORKSHOP</span>
          <h2>{exercise.title}</h2>
          <p>{exercise.goal}</p>
        </div>
        <span className={`java-practice-state ${report?.ready ? "passed" : ""}`}>
          {report ? (report.ready ? "검사 통과" : "구현 필요") : "검사 전"}
        </span>
      </header>
      <div className="java-practice-grid">
        <div>
          <h3>직접 작성할 부분</h3>
          <ol>
            {exercise.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Link
            className="java-practice-source"
            to={`/inventory/${item.id}?tab=source&file=${fileIndex}`}
          >
            {exercise.file}.java 열기 ↗
          </Link>
          <p className="java-practice-path">{exercise.path}</p>
        </div>
        <aside>
          <h3>막히면 이 부분부터</h3>
          <p>{exercise.hint}</p>
          <p>
            IntelliJ에서 TODO를 수정하고 백엔드를 다시 실행한 뒤 검사하세요. 이 화면의 소스는 읽기
            전용입니다.
          </p>
        </aside>
      </div>
      <div className="java-practice-actions">
        <button onClick={inspect} disabled={pending}>
          {pending ? "내 코드 검사 중…" : "반영된 내 Java 코드 검사"}
        </button>
        <span>별도 샘플로 실행 · 기존 기능과 데이터 유지</span>
      </div>
      <div aria-live="polite">
        {error && <p className="java-practice-error">{error}</p>}
        {report && (
          <ul className="java-practice-results">
            {report.checks.map((check) => (
              <li key={check.title}>
                <span>{check.passed ? "✓" : "○"}</span>
                <div>
                  <strong>{check.title}</strong>
                  <p>{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <details>
        <summary>터미널에서 이 카드만 검사하기</summary>
        <pre>{`.\\backend\\gradlew.bat -p backend test --tests "*InventoryPracticeContractTests.${{ "parallel-stream": "parallelStream", "index-tuning": "indexTuning", "gw-sync": "gwSync" }[item.id] || item.id}" -PinventoryPractice`}</pre>
        <p>
          작성 전에는 실패하는 과제용 테스트입니다. 일반 테스트 실행에서는 제외됩니다. 전체 안내:
          docs/INVENTORY_PRACTICE.md
        </p>
      </details>
      <p className="java-practice-footnote">
        검사는 정해진 샘플과 경계값을 확인합니다. 통과한 코드가 기존 기능에 자동 연결되지는
        않습니다. Kafka 카드는 내 코드로 게임을 실행하는 기능도 제공합니다.
      </p>
    </section>
  );
}
