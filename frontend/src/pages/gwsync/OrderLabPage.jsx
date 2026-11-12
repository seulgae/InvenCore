import { useEffect, useState } from "react";
import api from "../../api/axios";
import "../../styles/OrderLab.css";
import ParcelFactoryGame from "../../components/inventory/ParcelFactoryGame";
import KafkaPracticePanel from "../../components/inventory/KafkaPracticePanel";

const groups = { PROCESSING: "주문 처리", AUDIT: "감사 기록" };
const outcomes = {
  APPLIED: "정상 반영",
  APPLIED_WITH_GAP: "업무 순서 누락 감지",
  DUPLICATE: "중복 무시",
  STALE: "과거 버전 무시",
  REJECTED: "학습 코드에서 반영 거부",
};
const storageKey = "invencore-order-lab-run";
export default function OrderLabPage() {
  const [runId, setRunId] = useState(
    () => sessionStorage.getItem(storageKey) || "",
  );
  const [run, setRun] = useState(null);
  const [runtime, setRuntime] = useState(null);
  const [view, setView] = useState(null);
  const [routing, setRouting] = useState("KEYED");
  const [orders, setOrders] = useState(3);
  const [filter, setFilter] = useState("PROCESSING");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [implementation, setImplementation] = useState("REFERENCE");
  const [practiceReport, setPracticeReport] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;
    const load = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const state = await api.get("/order-lab/state", {
          signal: controller.signal,
          timeout: 15000,
        });
        setRuntime(state.data);
        if (runId) {
          try {
            const result = await api.get(`/order-lab/runs/${runId}`, {
              signal: controller.signal,
            });
            setView(result.data);
          } catch (error) {
            if (error.response?.status !== 404) throw error;
            sessionStorage.removeItem(storageKey);
            setRunId("");
            setView(null);
            setRun(null);
            setNotice(
              "서버 초기화로 이전 실습이 사라졌습니다. 새 실습을 생성하세요.",
            );
          }
        }
        setError("");
      } catch (error) {
        if (error.code !== "ERR_CANCELED")
          setError(
            error.response?.data?.message || "실습 서버에 연결하지 못했습니다.",
          );
      } finally {
        fetching = false;
      }
    };
    load();
    const timer = setInterval(load, 2000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [runId, refresh]);
  const act = async (action) => {
    setPending(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setRefresh((value) => value + 1);
      return result;
    } catch (error) {
      setError(error.response?.data?.message || "실습 요청에 실패했습니다.");
      return null;
    } finally {
      setPending(false);
    }
  };
  const start = (options) =>
    act(async () => {
      const { data } = await api.post("/order-lab/runs", {
        routing: options?.routing ?? routing,
        orders: Number(options?.orders ?? orders),
        implementation,
      });
      sessionStorage.setItem(storageKey, data.runId);
      setRunId(data.runId);
      setRun(data);
      setRouting(data.routing);
      setOrders(data.events / 4);
      setView(null);
      setNotice("발행 대기에 저장했습니다. 발행·수신 결과를 자동 조회합니다.");
      return data;
    });
  const control = (group, action, scopedRunId) =>
    act(async () => {
      const path =
        scopedRunId && action === "replay"
          ? `/order-lab/groups/${group}/replay/${scopedRunId}`
          : `/order-lab/groups/${group}/${action}`;
      const { data } = await api.post(path);
      setNotice(
        action === "replay"
          ? "전용 실습 토픽의 시작 위치로 seek를 요청했습니다. 재개를 누르면 과거 이벤트를 다시 처리합니다."
          : `${groups[group]} 그룹 명령을 요청했습니다.`,
      );
      return data;
    });
  const local = (runtime?.mode ?? "LOCAL_SIMULATION") === "LOCAL_SIMULATION";
  const checkPractice = () =>
    act(async () => {
      const { data } = await api.get("/order-lab/practice");
      setPracticeReport(data);
      if (!data.ready) setImplementation("REFERENCE");
      return data;
    });
  const receipts = [...(view?.deliveries || [])].reverse();
  const visible = receipts.filter((row) => row.group === filter);
  const keys = [...new Set(visible.map((row) => row.orderId))];
  const ignored = receipts.filter((row) =>
    ["DUPLICATE", "STALE"].includes(row.outcome),
  ).length;
  const gaps = receipts.filter(
    (row) => row.outcome === "APPLIED_WITH_GAP",
  ).length;
  return (
    <div className="order-lab">
      <ParcelFactoryGame
        key={implementation}
        implementation={implementation}
        runtime={runtime}
        view={view}
        pending={pending}
        start={start}
        control={control}
        error={error}
      />
      <details className="factory-practice-details">
        <summary>직접 Java로 구현하기 · TODO 과제 / Kafka 용어</summary>
        <KafkaPracticePanel
          implementation={implementation}
          onImplementation={setImplementation}
          report={practiceReport}
          onCheck={checkPractice}
          pending={pending}
        />
      </details>
      <details className="factory-engine-details">
        <summary>게임 뒤의 기술 보기 · 파티션 / 오프셋 / 소비 그룹</summary>
        <div className="factory-technical">
          <header className="lab-heading">
            <span>KAFKA / ORDER EVENT LAB</span>
            <h2>주문 상태 이벤트 실험실</h2>
            <p>
              생성 → 결제 → 포장 → 발송. 같은 이벤트를 두 그룹이 독립적으로
              읽고, 멈춘 위치에서 다시 이어갑니다.
            </p>
          </header>
          <div className={`lab-mode ${local ? "local" : ""}`}>
            <strong>
              {!runtime
                ? "연결 확인 중"
                : local
                  ? "LOCAL MODEL · 실제 Kafka 아님"
                  : "KAFKA LIVE · 브로커 오프셋 조회"}
            </strong>
            <code>{runtime?.topic || "—"}</code>
            <p>
              {local
                ? "메모리 체크포인트와 DB 로그로 원리를 재현합니다. 파티션을 2→1→0 순서로 읽는 의도적인 모형이며 Kafka의 성능·실제 소비 순서 측정값은 아닙니다."
                : "외부 모드는 실제 3개 파티션과 그룹별 소비자 3개를 사용합니다. 커밋·끝 오프셋과 lag는 Kafka Admin API에서 읽습니다."}
            </p>
          </div>
          <div className="lab-guide">
            <article>
              <span>01 · 순서</span>
              <p>
                주문 ID로 묶어 발행하고 같은 주문의 파티션·오프셋을 확인합니다.
                파티션 분산 방식과 비교하세요.
              </p>
            </article>
            <article>
              <span>02 · 분리</span>
              <p>
                주문 처리 그룹을 일시정지한 뒤 발행합니다. 감사 그룹은 계속
                처리하고 멈춘 그룹에는 lag가 쌓입니다.
              </p>
            </article>
            <article>
              <span>03 · 재처리</span>
              <p>
                처리가 끝나면 일시정지 → 처음부터 재처리 → 재개. 수신 기록은
                늘어도 최종 상태는 뒤로 가지 않습니다.
              </p>
            </article>
          </div>
          <form
            className="lab-send"
            onSubmit={(event) => {
              event.preventDefault();
              start();
            }}
          >
            <label>
              파티션 전략
              <select
                value={routing}
                onChange={(event) => setRouting(event.target.value)}
                disabled={pending}
              >
                <option value="KEYED">주문 ID별 같은 파티션</option>
                <option value="SPREAD">같은 주문을 여러 파티션에 분산</option>
              </select>
            </label>
            <label>
              주문 수
              <input
                type="number"
                min={1}
                max={6}
                required
                value={orders}
                onChange={(event) => setOrders(event.target.value)}
                disabled={pending}
              />
            </label>
            <button disabled={pending || !runtime}>
              실습 생성 · {Number(orders || 0) * 4}개 발행
            </button>
          </form>
          {error && (
            <p className="lab-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="lab-notice" role="status">
              {notice}
            </p>
          )}
          <section
            className="lab-groups"
            aria-label="소비 그룹과 파티션 오프셋"
          >
            {runtime?.groups.map((group) => (
              <article key={group.group}>
                <header>
                  <div>
                    <small>{group.group}</small>
                    <h3>{groups[group.group]}</h3>
                  </div>
                  <span>
                    {group.paused
                      ? "일시정지 완료"
                      : group.pauseRequested
                        ? "정지 요청 중"
                        : "소비 중"}
                  </span>
                  <strong>
                    lag {group.partitions.reduce((sum, p) => sum + p.lag, 0)}
                  </strong>
                </header>
                <div className="lab-group-actions">
                  <button
                    disabled={pending || group.pauseRequested}
                    onClick={() => control(group.group, "pause")}
                  >
                    일시정지
                  </button>
                  <button
                    disabled={pending || !group.pauseRequested}
                    onClick={() => control(group.group, "resume")}
                  >
                    재개
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => control(group.group, "restart")}
                  >
                    소비자 재시작
                  </button>
                  <button
                    disabled={pending || !group.paused}
                    onClick={() => control(group.group, "replay")}
                  >
                    처음부터 재처리
                  </button>
                </div>
                <div className="lab-table-scroll">
                  <table>
                    <caption>
                      커밋 오프셋 = 다음에 읽을 위치 · lag = 끝 − 커밋
                    </caption>
                    <thead>
                      <tr>
                        <th>파티션</th>
                        <th>시작</th>
                        <th>끝</th>
                        <th>커밋</th>
                        <th>lag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.partitions.map((p) => (
                        <tr key={p.partition}>
                          <th>P{p.partition}</th>
                          <td>{p.beginningOffset}</td>
                          <td>{p.endOffset}</td>
                          <td>{p.committedOffset ?? "미커밋"}</td>
                          <td className={p.lag ? "lab-lag" : ""}>{p.lag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </section>
          <p className="lab-footnote">
            재시작은 같은 그룹의 커밋 위치에서 이어 읽습니다. 재처리는 전용 실습
            토픽 전체에 적용되어 이전 실행의 주문도 다시 읽을 수 있습니다.
            일시정지 완료를 확인한 뒤 재처리하고 재개하세요.
          </p>
          {runId && (
            <section className="lab-observation">
              <header>
                <h3>현재 실행 관찰</h3>
                <code>{runId}</code>
              </header>
              <div className="lab-metrics">
                <div>
                  <span>발행 확인</span>
                  <strong>
                    {view?.published ?? 0}
                    {run ? ` / ${run.events}` : ""}
                  </strong>
                </div>
                <div>
                  <span>관측 수신 기록</span>
                  <strong>{receipts.length}</strong>
                </div>
                <div>
                  <span>중복·과거 버전 무시</span>
                  <strong>{ignored}</strong>
                </div>
                <div>
                  <span>업무 순서 누락 감지</span>
                  <strong>{gaps}</strong>
                </div>
              </div>
              <label className="lab-filter">
                조회할 그룹
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  {Object.entries(groups).map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="lab-order-timelines">
                {keys.map((key) => (
                  <article key={key}>
                    <header>
                      <code>{key}</code>
                      <span>
                        최종:{" "}
                        {view?.projections.find(
                          (p) => p.group === filter && p.orderId === key,
                        )?.status || "대기"}
                      </span>
                    </header>
                    <div>
                      {visible
                        .filter((row) => row.orderId === key)
                        .map((row) => (
                          <span
                            key={row.id}
                            className={
                              row.outcome !== "APPLIED" ? "changed" : ""
                            }
                          >
                            <strong>
                              {row.sequence} · {row.status}
                            </strong>
                            <small>
                              P{row.partition} / offset {row.offset}
                            </small>
                            <em>{outcomes[row.outcome]}</em>
                          </span>
                        ))}
                    </div>
                  </article>
                ))}
              </div>
              <div className="lab-table-scroll">
                <table>
                  <caption>
                    처리 기록 순서 · 최근 240개 · 오프셋은 파티션 안에서만
                    비교합니다
                  </caption>
                  <thead>
                    <tr>
                      <th>주문 ID</th>
                      <th>업무 순번</th>
                      <th>상태</th>
                      <th>파티션</th>
                      <th>오프셋</th>
                      <th>처리 결과</th>
                      <th>소비 작업자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.id}>
                        <td>{row.orderId}</td>
                        <td>{row.sequence}</td>
                        <td>{row.status}</td>
                        <td>P{row.partition}</td>
                        <td>{row.offset}</td>
                        <td>{outcomes[row.outcome]}</td>
                        <td>{row.worker}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!visible.length && (
                <p className="lab-footnote">
                  아직 이 그룹의 처리 기록이 없습니다. 일시정지 여부와 발행
                  상태를 확인하세요.
                </p>
              )}
            </section>
          )}
          <details className="lab-details">
            <summary>실험에서 확인할 수 있는 것과 보장 범위</summary>
            <ul>
              <li>
                같은 주문은 고정된 3개 파티션의 같은 위치로 보냅니다. KEYED는
                Kafka 기본 키 해시와 같은 Murmur2로 계산한 파티션을 명시하고,
                SPREAD는 업무 순번에 따라 파티션을 바꿉니다.
              </li>
              <li>
                Kafka의 순서는 파티션 로그의 순서입니다. 같은 키라도 여러
                생산자가 업무 순서를 다르게 발행하면 잘못된 업무 순서 자체를
                Kafka가 고쳐주지는 않습니다.
              </li>
              <li>
                분산 실험에서 매번 역순이 관측되는 것은 아닙니다. 결과가 우연히
                순서대로여도 파티션 사이의 전역 순서가 보장되는 것은 아닙니다.
              </li>
              <li>
                각 그룹은 같은 이벤트를 독립적으로 소비합니다. 외부 모드의 같은
                그룹 안에서는 파티션별로 소비자를 할당해 병렬 처리합니다.
              </li>
              <li>
                JPA 대상 반영 후 수동으로 오프셋을 커밋합니다. DB 반영과 커밋은
                하나의 트랜잭션이 아니므로 재전달이 가능하고, 업무 버전 비교가
                중복·과거 상태를 무시합니다. 정확히 한 번 처리를 주장하지
                않습니다.
              </li>
              <li>
                끝 오프셋과 lag는 실습 토픽 전체 기준입니다. 처리 기록과 최종
                상태는 현재 실행 기준이며 최근 240개만 화면에 표시합니다.
              </li>
              <li>
                일반 GW 연동은 최신 형상을 합칠 수 있지만, 이 실습은 4단계
                이벤트를 각각 저장·발행합니다. 기존 GW 데이터·토픽에는 제어
                명령을 보내지 않습니다.
              </li>
              <li>
                H2와 로컬 모형 상태는 서버 재시작 시 초기화됩니다. 실제 Kafka
                모드의 브로커 장애 복제·처리량 벤치마크는 이 실습 범위에
                포함하지 않습니다.
              </li>
            </ul>
          </details>
        </div>
      </details>
    </div>
  );
}
