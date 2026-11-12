import { useState } from "react";
import "../../styles/ParcelFactory.css";

const missions = [
  {
    title: "레일을 골라라",
    goal: "한 택배의 작업 카드 4장을 순서대로 처리하세요.",
    lesson: "같은 택배는 같은 레일로 보내야 순서가 유지돼요.",
  },
  {
    title: "잠든 작업자",
    goal: "작업자를 쉬게 하고 카드를 쌓은 뒤, 깨워서 밀린 일을 끝내세요.",
    lesson:
      "처리가 잠깐 멈춰도 카드가 남아 있어 나중에 이어갈 수 있어요. 검수원은 계속 일해요.",
  },
  {
    title: "되감기 방어전",
    goal: "끝낸 작업을 다시 읽어도 같은 택배가 두 번 발송되지 않게 하세요.",
    lesson:
      "기록은 다시 읽을 수 있어요. 이미 끝낸 작업을 걸러야 중복 처리를 막을 수 있어요.",
  },
];
const steps = {
  CREATED: "접수",
  PAID: "결제",
  PACKED: "포장",
  SHIPPED: "발송",
};
const laneColors = ["#e7b66c", "#8bbcf3", "#a5c994"];

function Worker({ asleep = false, audit = false }) {
  return (
    <svg viewBox="0 0 100 100" className="factory-worker" aria-hidden="true">
      <path
        d="M20 69h60v24H20z"
        fill={audit ? "#768eb3" : "#b3b89b"}
        stroke="#162333"
        strokeWidth="3"
      />
      <rect
        x="22"
        y="27"
        width="56"
        height="46"
        rx="12"
        fill={audit ? "#bacbe3" : "#e3d6a9"}
        stroke="#172839"
        strokeWidth="3"
      />
      <path
        d="M18 32h64M29 30V19h42v11"
        stroke={audit ? "#82a0d4" : "#ecb45d"}
        strokeWidth="9"
        strokeLinejoin="round"
      />
      {asleep ? (
        <path d="M34 48h10m12 0h10" stroke="#253746" strokeWidth="4" />
      ) : (
        <>
          <circle cx="39" cy="48" r="4" fill="#253746" />
          <circle cx="61" cy="48" r="4" fill="#253746" />
        </>
      )}
      <path
        d={asleep ? "M44 61h12" : "M42 60q8 8 16 0"}
        fill="none"
        stroke="#253746"
        strokeWidth="3"
      />
      <path
        d="M20 76L8 87m72-11 12 11"
        stroke={audit ? "#82a0d4" : "#c5b67c"}
        strokeWidth="8"
        strokeLinecap="round"
      />
      {asleep && (
        <text x="76" y="18" fill="#bcd6ef" fontSize="17" fontWeight="bold">
          Zz
        </text>
      )}
    </svg>
  );
}

function Truck() {
  return (
    <svg viewBox="0 0 150 90" className="factory-truck" aria-hidden="true">
      <rect
        x="10"
        y="15"
        width="85"
        height="52"
        rx="5"
        fill="#89bda5"
        stroke="#203747"
        strokeWidth="3"
      />
      <path
        d="M96 32h27l18 20v15H96z"
        fill="#a9cddd"
        stroke="#203747"
        strokeWidth="3"
      />
      <path d="M105 39h15l11 13h-26z" fill="#263e55" />
      <path
        d="M49 27v27m-13-13 13 13 14-13"
        fill="none"
        stroke="#234d43"
        strokeWidth="5"
      />
      <circle
        cx="35"
        cy="69"
        r="12"
        fill="#182637"
        stroke="#aebdcd"
        strokeWidth="4"
      />
      <circle
        cx="117"
        cy="69"
        r="12"
        fill="#182637"
        stroke="#aebdcd"
        strokeWidth="4"
      />
    </svg>
  );
}

export default function ParcelFactoryGame({
  runtime,
  view,
  pending,
  start,
  control,
  error,
  implementation = "REFERENCE",
}) {
  const [mission, setMission] = useState(0);
  const [round, setRound] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pauseProof, setPauseProof] = useState(false);
  const [rewound, setRewound] = useState(false);
  const [completed, setCompleted] = useState([]);
  const processing = runtime?.groups.find(
    (group) => group.group === "PROCESSING",
  );
  const audit = runtime?.groups.find((group) => group.group === "AUDIT");
  const current = round && view?.runId === round.runId ? view : null;
  const deliveries = [...(current?.deliveries || [])].reverse();
  const handled = deliveries.filter((row) => row.group === "PROCESSING");
  const inspected = deliveries.filter((row) => row.group === "AUDIT");
  const protectedCount = handled.filter((row) =>
    ["STALE", "DUPLICATE"].includes(row.outcome),
  ).length;
  const gaps = handled.filter(
    (row) => row.outcome === "APPLIED_WITH_GAP",
  ).length;
  const shipped =
    current?.projections.filter(
      (row) => row.group === "PROCESSING" && row.status === "SHIPPED",
    ).length || 0;
  const lag = processing?.partitions.reduce((sum, p) => sum + p.lag, 0) || 0;
  const ready = Boolean(round && current && shipped === round.orders);
  const cleared =
    ready &&
    (mission === 0
      ? round.routing === "KEYED" && gaps === 0
      : mission === 1
        ? pauseProof
        : rewound && protectedCount > 0);
  const locked = busy || pending || !runtime;
  const local = (runtime?.mode ?? "LOCAL_SIMULATION") === "LOCAL_SIMULATION";
  const resetMission = (index) => {
    setMission(index);
    setRound(null);
    setPauseProof(false);
    setRewound(false);
  };
  const begin = async (routing = "KEYED", count = 1, keepPaused = false) => {
    setBusy(true);
    setRound(null);
    setPauseProof(false);
    setRewound(false);
    try {
      if (!keepPaused) {
        if (!(await control("PROCESSING", "resume"))) return;
      }
      if (!(await control("AUDIT", "resume"))) return;
      const result = await start({ routing, orders: count });
      if (result) setRound({ ...result, orders: count });
    } finally {
      setBusy(false);
    }
  };
  const wake = async () => {
    if (lag > 0 && inspected.length > 0) setPauseProof(true);
    await control("PROCESSING", "resume");
  };
  const rewind = async () => {
    if (await control("PROCESSING", "replay", round.runId)) setRewound(true);
  };
  const next = () => {
    setCompleted((previous) => [...new Set([...previous, mission])]);
    if (mission < 2) resetMission(mission + 1);
  };
  return (
    <div className="parcel-factory">
      <header className="factory-title">
        <div>
          <span className="factory-eyebrow">PLAY THE PIPELINE</span>
          <h2>작은 택배 공장</h2>
          <p>상자를 보내고, 작업자를 깨우고, 중복 배송을 막아보세요.</p>
        </div>
        <span className="factory-mode">
          {implementation === "LEARNER" ? "내 Java 코드 · " : "완성 예제 · "}
          {!runtime
            ? "공장 연결 중"
            : local
              ? "연습 공장 · 내부 이벤트"
              : "실제 Kafka 공장"}
        </span>
      </header>
      <nav className="factory-missions" aria-label="게임 미션">
        {missions.map((item, index) => (
          <button
            key={item.title}
            className={mission === index ? "active" : ""}
            aria-pressed={mission === index}
            onClick={() => resetMission(index)}
            disabled={locked}
          >
            <span>{completed.includes(index) ? "★" : `0${index + 1}`}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
      </nav>
      <section className="factory-brief" aria-label="현재 미션">
        <div>
          <span>MISSION 0{mission + 1}</span>
          <h3>{missions[mission].goal}</h3>
          <p>택배 하나마다 접수·결제·포장·발송 카드가 한 장씩 생깁니다.</p>
        </div>
        <span
          className="factory-stars"
          aria-label={`완료한 미션 ${completed.length}개`}
        >
          {[0, 1, 2].map((index) => (
            <b
              key={index}
              className={completed.includes(index) ? "earned" : ""}
            >
              ★
            </b>
          ))}
        </span>
      </section>

      <div className="factory-board" aria-label="택배 공장 상태">
        <div className="factory-dock">
          <span className="factory-sign">주문 접수</span>
          <div className="factory-stack" aria-hidden="true">
            <i>▣</i>
            <i>▣</i>
            <i>▣</i>
          </div>
          <strong>{current?.published ?? 0}장</strong>
          <small>이번 주문의 발행 확인</small>
        </div>
        <div className="factory-lanes">
          {[0, 1, 2].map((index) => {
            const partition = processing?.partitions.find(
              (p) => p.partition === index,
            );
            const passed = handled.filter(
              (row) => row.partition === index && row.outcome === "APPLIED",
            );
            const recent = passed.slice(-4);
            return (
              <div
                className="factory-lane"
                key={index}
                style={{ "--lane-color": laneColors[index] }}
              >
                <header>
                  <strong>레일 {index + 1}</strong>
                  <span>전체 대기 {partition?.lag ?? 0}장</span>
                </header>
                <div
                  className={`factory-belt ${processing?.paused ? "sleeping" : ""}`}
                >
                  {(partition?.lag || 0) > 0 ? (
                    Array.from(
                      { length: Math.min(partition.lag, 6) },
                      (_, i) => (
                        <span className="factory-parcel waiting" key={i}>
                          <b>▣</b>
                          <small>대기</small>
                        </span>
                      ),
                    )
                  ) : recent.length ? (
                    recent.map((row) => (
                      <span className="factory-parcel passed" key={row.id}>
                        <b>{row.sequence}</b>
                        <small>{steps[row.status]}</small>
                      </span>
                    ))
                  ) : (
                    <span className="factory-belt-empty">
                      작업 카드를 기다리는 중
                    </span>
                  )}
                </div>
                <small className="factory-lane-caption">
                  {recent.length
                    ? "이번 주문에서 처리한 카드"
                    : "카드를 받아 보관하는 레일"}
                </small>
              </div>
            );
          })}
        </div>
        <div
          className={`factory-station ${processing?.paused ? "sleeping" : ""}`}
        >
          <span className="factory-sign">배송 작업자</span>
          <Worker asleep={processing?.paused} />
          <strong>
            {processing?.paused
              ? "잠깐 쉬는 중"
              : processing?.pauseRequested
                ? "쉬러 가는 중"
                : "일할 준비 완료"}
          </strong>
          <span className="factory-waiting">밀린 카드 {lag}장</span>
          <Truck />
          <span className="factory-shipped">
            이번 택배 <b>{shipped}</b>건 발송
          </span>
        </div>
        <div className="factory-audit">
          <Worker asleep={audit?.paused} audit />
          <div>
            <strong>독립 검수원</strong>
            <p>
              {audit?.paused
                ? "검수원이 쉬고 있어요."
                : "배송 작업자와 따로 카드를 읽어요."}
            </p>
          </div>
          <span>
            이번 주문 <b>{inspected.length}</b>장 기록
          </span>
        </div>
      </div>

      <section className="factory-controls" aria-label="게임 조작">
        {mission === 0 && (
          <>
            <p>
              <strong>어느 레일로 보낼까요?</strong> 같은 택배의 카드를 한
              레일에 모아보세요.
            </p>
            <div>
              <button
                className="factory-main-button"
                disabled={locked}
                onClick={() => begin("KEYED")}
              >
                ▣ 같은 택배는 같은 레일로
              </button>
              <button disabled={locked} onClick={() => begin("SPREAD")}>
                ⇢ 여러 레일로 흩어 보내기
              </button>
            </div>
          </>
        )}
        {mission === 1 && (
          <>
            <p>
              <strong>쉬기 → 보내기 → 깨우기</strong> 배송 작업자가 쉬는 동안
              검수원은 계속 일하는지 보세요.
            </p>
            <div>
              <button
                disabled={locked || processing?.pauseRequested}
                onClick={() => control("PROCESSING", "pause")}
              >
                ☾ 작업자 쉬게 하기
              </button>
              <button
                className="factory-main-button"
                disabled={locked || !processing?.paused}
                onClick={() => begin("KEYED", 3, true)}
              >
                ▣ 택배 3건 보내기
              </button>
              <button
                disabled={
                  locked ||
                  !processing?.pauseRequested ||
                  !round ||
                  inspected.length === 0 ||
                  lag === 0
                }
                onClick={wake}
              >
                ☀ 작업자 깨우기
              </button>
            </div>
          </>
        )}
        {mission === 2 && (
          <>
            <p>
              <strong>완료 → 쉬기 → 되감기 → 가동</strong> 끝낸 카드를 다시
              읽어도 발송 건수가 늘어나지 않게 해보세요.
            </p>
            <div>
              <button
                className="factory-main-button"
                disabled={locked}
                onClick={() => begin("KEYED")}
              >
                ▣ 택배 한 건 준비
              </button>
              <button
                disabled={locked || !ready || processing?.pauseRequested}
                onClick={() => control("PROCESSING", "pause")}
              >
                ☾ 작업자 쉬게 하기
              </button>
              <button
                disabled={locked || !ready || !processing?.paused}
                onClick={rewind}
              >
                ↶ 완료 기록 되감기
              </button>
              <button
                disabled={locked || !rewound || !processing?.pauseRequested}
                onClick={() => control("PROCESSING", "resume")}
              >
                ▶ 다시 가동
              </button>
            </div>
          </>
        )}
        <p className="factory-feedback" role="status">
          {error
            ? error
            : locked
              ? "공장에 요청을 보내고 있어요…"
              : cleared
                ? "미션 성공! 공장의 실제 처리 기록으로 확인했어요."
                : round && !current
                  ? "주문을 등록했어요. 공장의 처리 결과를 기다리는 중…"
                  : mission === 0 && round?.routing === "SPREAD" && ready
                    ? "여러 레일은 서로 순서를 약속하지 않아요. 같은 레일로 다시 도전해보세요."
                    : mission === 1 && round && processing?.paused
                      ? `작업자가 쉬고 있어요. 검수원 ${inspected.length}장 기록 · 배송 작업자 대기 ${lag}장`
                      : mission === 2 && rewound
                        ? `다시 읽은 작업 중 ${protectedCount}장을 걸러냈어요. 발송은 ${shipped}건이에요.`
                        : "버튼을 눌러 이번 미션을 시작하세요."}
        </p>
      </section>
      <div className={`factory-result ${cleared ? "cleared" : ""}`}>
        <div>
          <span>{cleared ? "★ MISSION CLEAR" : "이번 미션에서 발견할 것"}</span>
          <p>{missions[mission].lesson}</p>
        </div>
        {cleared && (
          <button onClick={next} disabled={locked}>
            {mission === 2
              ? completed.length === 3
                ? "★ 모든 미션 완료"
                : "★ 마지막 별 받기"
              : "다음 미션 →"}
          </button>
        )}
      </div>
      <div className="factory-score">
        <span>
          발송 택배 <b>{shipped}</b>
        </span>
        <span>
          검수 기록 <b>{inspected.length}</b>
        </span>
        <span>
          중복 작업 차단 <b>{protectedCount}</b>
        </span>
        <span>
          순서 누락 감지 <b>{gaps}</b>
        </span>
      </div>
      <p className="factory-disclosure">
        {local
          ? "연습 모드는 서버 내부 모형입니다. 실제 Kafka가 실행되는 것은 아닙니다."
          : "실제 Kafka의 처리 기록과 오프셋으로 공장 상태를 표시합니다."}{" "}
        공장 전체 대기량과 이번 주문의 기록을 구분해 표시합니다. 움직이는 카드는
        처리 기록의 시각화입니다.
      </p>
    </div>
  );
}
