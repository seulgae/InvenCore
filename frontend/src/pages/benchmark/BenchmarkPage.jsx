import { useEffect, useState } from "react";
import apiClient from "../../api/axios";
import "../../styles/Benchmark.css";
const number = (value) =>
  Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 3 });
const milliseconds = (value) => `${number(value)} ms`;

export default function BenchmarkPage({ kind = "streams" }) {
  const [environment, setEnvironment] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiClient
      .get("/benchmarks", { signal: controller.signal })
      .then(({ data }) => {
        setEnvironment(data);
        setError("");
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED")
          setError(
            "실험 서버에 연결하지 못했습니다. 백엔드를 실행하고 상태를 다시 확인하세요.",
          );
      });
    return () => controller.abort();
  }, [reload]);
  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const { data } = await apiClient.post(`/benchmarks/${kind}`, null, {
        timeout: 120000,
      });
      setResult(data);
      setEnvironment(data.environment);
      setHistory((previous) => [data, ...previous].slice(0, 8));
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "측정에 실패했습니다. 서버 연결과 실행 상태를 확인하세요.",
      );
    } finally {
      setRunning(false);
    }
  };
  const isStream = kind === "streams";
  const maximum = result
    ? Math.max(result.baseline.medianMs, result.optimized.medianMs, 0.001)
    : 1;
  return (
    <div className="benchmark-page">
      <header className="benchmark-heading">
        <div>
          <span className="benchmark-eyebrow">
            LIVE PERFORMANCE LAB /{" "}
            {isStream ? "PARALLEL STREAM" : "COMPOSITE INDEX"}
          </span>
          <h2>
            {isStream ? "순차 · 병렬 스트림 비교" : "복합 인덱스 전 · 후 비교"}
          </h2>
          <p>
            {isStream
              ? "같은 숫자 목록을 같은 CPU 연산으로 처리합니다. stream()과 parallelStream()의 실제 실행 시간을 비교합니다."
              : "동일한 데이터를 가진 두 테이블에서 같은 조건·집계 SQL을 실행합니다. 한쪽에만 (account_id, state) 복합 인덱스가 있습니다."}
          </p>
        </div>
        <span
          className={`benchmark-ready ${environment?.ready ? "ready" : ""}`}
        >
          {environment?.ready ? "DATA READY" : "NOT READY"}
        </span>
      </header>
      <div className="benchmark-environment">
        <div>
          <span>데이터 / 테이블</span>
          <strong>
            {environment ? `${number(environment.rowsPerTable)}행` : "—"}
          </strong>
        </div>
        <div>
          <span>할당된 논리 CPU</span>
          <strong>{environment?.processors ?? "—"}</strong>
        </div>
        <div>
          <span>최대 병렬 작업자</span>
          <strong>{environment?.parallelism ?? "—"}</strong>
        </div>
        <div>
          <span>실행 환경</span>
          <strong>
            {environment ? `Java ${environment.javaVersion}` : "—"}
            <small>{environment?.database}</small>
          </strong>
        </div>
      </div>
      <div className="benchmark-actions">
        <button disabled={running || !environment?.ready} onClick={run}>
          {running ? "측정 중 · 워밍업과 반복 실행..." : "▷ 비교 실험 실행"}
        </button>
        <button
          className="benchmark-secondary"
          disabled={running}
          onClick={() => setReload(reload + 1)}
        >
          서버 상태 확인
        </button>
        <span>
          워밍업 2회 + 측정 5회 · 순서 교대 ·{" "}
          {isStream ? "1회 전체 목록 처리" : "1회 8개 조회 합계"}
        </span>
      </div>
      {error && (
        <p className="benchmark-error" role="alert">
          {error}
        </p>
      )}
      {running && (
        <p className="benchmark-progress" role="status">
          동일한 부하를 두 방식으로 실행하고 있습니다. 이전 결과는 아래에
          유지됩니다.
        </p>
      )}
      {result ? (
        <>
          <div className="benchmark-outcomes">
            <article>
              <span>기준 대비 속도 비율</span>
              <strong>{number(result.speedup)}×</strong>
              <p>
                {result.speedup >= 1
                  ? "비교 방식이 더 빠르게 측정됨"
                  : "비교 방식이 더 느리게 측정됨"}
              </p>
            </article>
            <article>
              <span>중앙값 시간 변화</span>
              <strong>
                {result.changePercent >= 0 ? "−" : "+"}
                {number(Math.abs(result.changePercent))}%
              </strong>
              <p>기준 실행 시간에 대한 변화</p>
            </article>
            <article>
              <span>계산 결과 검증</span>
              <strong>{result.resultsMatch ? "일치" : "불일치"}</strong>
              <p>각 반복의 checksum 동일성 확인</p>
            </article>
          </div>
          <section className="benchmark-chart" aria-label="실행 시간 비교">
            <h3>
              실행 시간 중앙값 <small>낮을수록 빠름</small>
            </h3>
            {[result.baseline, result.optimized].map((measurement, index) => (
              <div className="benchmark-bar-row" key={measurement.label}>
                <div>
                  <span>{measurement.label}</span>
                  <strong>{milliseconds(measurement.medianMs)}</strong>
                </div>
                <div className="benchmark-bar-track">
                  <div
                    className={index ? "optimized" : "baseline"}
                    style={{
                      width: `${Math.max(0.5, (measurement.medianMs / maximum) * 100)}%`,
                    }}
                  />
                </div>
                <p>
                  최소 {milliseconds(measurement.minMs)} / 최대{" "}
                  {milliseconds(measurement.maxMs)} ·{" "}
                  {number(result.operationsPerSample)}{" "}
                  {isStream ? "목록 처리" : "쿼리"}/회
                </p>
              </div>
            ))}
          </section>
          <div className="benchmark-table-scroll">
            <table className="benchmark-table">
              <caption>전체 측정값 · 워밍업과 실행 계획 확인 시간 제외</caption>
              <thead>
                <tr>
                  <th>반복</th>
                  <th>{result.baseline.label}</th>
                  <th>{result.optimized.label}</th>
                  <th>실행 순서</th>
                </tr>
              </thead>
              <tbody>
                {result.baseline.samplesMs.map((time, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{milliseconds(time)}</td>
                    <td>{milliseconds(result.optimized.samplesMs[index])}</td>
                    <td>{index % 2 === 0 ? "기준 → 비교" : "비교 → 기준"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="benchmark-detail">
            <summary>결과 checksum과 측정 정보</summary>
            <pre>
              {JSON.stringify(
                {
                  baselineChecksum: result.baseline.checksum,
                  optimizedChecksum: result.optimized.checksum,
                  measuredAt: result.measuredAt,
                  rows: result.rows,
                  warmups: result.warmups,
                  repetitions: result.repetitions,
                  seedMillis: result.environment.seedMillis,
                },
                null,
                2,
              )}
            </pre>
          </details>
          {!isStream && (
            <>
              <div className="benchmark-query">
                <h3>비교 SQL</h3>
                <pre>{result.sql}</pre>
                <p>
                  테이블만 다르고 데이터·조건·조회 횟수는 같습니다. 두 테이블
                  모두 기본키 인덱스는 있으며, 비교 대상은 추가 복합
                  인덱스입니다.
                </p>
              </div>
              <div className="benchmark-plans">
                <details className="benchmark-detail" open>
                  <summary>기준 · EXPLAIN ANALYZE</summary>
                  <pre>{result.baselinePlan}</pre>
                </details>
                <details className="benchmark-detail" open>
                  <summary>비교 · EXPLAIN ANALYZE</summary>
                  <pre>{result.optimizedPlan}</pre>
                </details>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="benchmark-empty">
          <span>◴</span>
          <h3>아직 측정하지 않았습니다</h3>
          <p>
            실행하면 현재 서버에서 측정한 값이 표시됩니다. 성과 수치를 미리
            채우지 않습니다.
          </p>
        </div>
      )}
      <aside className="benchmark-method">
        <h3>측정 조건</h3>
        <ul>
          <li>
            서버 시작 시 기본 30만 행씩 두 테이블에 준비합니다. BENCHMARK_ROWS로
            1,000~1,000,000행 범위를 조절할 수 있습니다.
          </li>
          <li>
            두 방식은 사전 결과 확인 후 워밍업 2회, 본 측정 5회를 실행합니다.
            중앙값으로 비교하며 실행 순서를 번갈아 바꿉니다.
          </li>
          <li>
            {isStream
              ? "병렬 스트림은 최대 4개 작업자의 전용 ForkJoinPool에서 실행합니다. 작업은 숫자당 64회 변환·합계이며 DB·대기 시간은 포함하지 않습니다."
              : "H2 메모리 DB의 워밍업 후 조회 실험입니다. 연결 획득과 JDBC 호출·집계 시간이 포함됩니다. 디스크 DB의 운영 성능과 같지 않습니다."}
          </li>
          <li>
            CPU 수·JIT·GC·서버 부하·DB 캐시에 따라 결과가 달라집니다. 병렬화나
            인덱스가 항상 더 빠르지는 않습니다. JMH 수준의 정밀 벤치마크가 아닌
            비교 학습용 실험입니다.
          </li>
          <li>
            서버 전체에서 한 번에 한 실험만 실행합니다. 데이터는 자동 준비되지만
            측정은 버튼을 누를 때만 실행합니다.
          </li>
        </ul>
      </aside>
      {history.length > 0 && (
        <section className="benchmark-history">
          <h3>
            최근 실행 <small>현재 화면에서 최대 8개 보관</small>
          </h3>
          <div className="benchmark-table-scroll">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>측정 시각</th>
                  <th>기준 중앙값</th>
                  <th>비교 중앙값</th>
                  <th>속도 비율</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr key={`${entry.measuredAt}-${index}`}>
                    <td>
                      {new Date(entry.measuredAt).toLocaleTimeString("ko-KR")}
                    </td>
                    <td>{milliseconds(entry.baseline.medianMs)}</td>
                    <td>{milliseconds(entry.optimized.medianMs)}</td>
                    <td>{number(entry.speedup)}×</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
