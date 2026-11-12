import { useEffect, useRef, useState } from "react";
import "../../styles/ParcelFactory.css";

const jobs = ["접수", "결제", "포장", "발송"];
const ignored = (row) => ["DUPLICATE", "STALE"].includes(row.outcome);
const keyOf = (row) => `${row.orderId}:${row.sequence}`;
const missions = [
  { title: "순서대로 보내요", goal: "작업 카드 4장을 1 → 2 → 3 → 4 순서로 처리해 보세요.", lesson: "한 택배의 카드를 같은 레일에 넣으면 순서대로 읽을 수 있어요.", kafka: "택배 번호 = Key · 레일 = Partition. Kafka는 같은 파티션 안에서 기록 순서를 보장합니다. 서로 다른 레일 사이에는 전체 순서 보장이 없어요." },
  { title: "쉬어도 사라지지 않아요", goal: "작업자를 쉬게 하고 택배를 쌓은 뒤, 다시 깨워 주세요.", lesson: "작업자가 쉬어도 작업 기록은 남고, 장부 직원은 따로 일해요.", kafka: "작업자와 장부 직원 = 서로 다른 Consumer Group. 같은 기록을 각자 읽습니다. 밀린 작업 수는 Lag, 이어 읽을 위치는 커밋한 Offset이에요." },
  { title: "두 번 보내면 안 돼요", goal: "발송을 끝낸 작업을 다시 읽어도 택배는 한 번만 보내세요.", lesson: "이미 처리한 작업을 걸러내면 다시 읽어도 중복 반영을 막을 수 있어요.", kafka: "기록 되감기 = Seek / Replay. Kafka는 재전달할 수 있으므로 업무 버전을 비교해 중복을 무시합니다. 이 방어는 Kafka가 자동으로 대신해 주지 않아요." },
];

function Bot({ asleep, working }) {
  return <svg className={`parcel-bot ${working ? "working" : ""}`} viewBox="0 0 76 90" aria-hidden="true">
    <path d="M38 9V2M30 3h16" stroke="#a9c6eb" strokeWidth="3" />
    <rect x="12" y="13" width="52" height="42" rx="12" fill={asleep ? "#8091a7" : "#dfbf82"} stroke="#142237" strokeWidth="3" />
    {asleep ? <path d="M23 32h10m10 0h10" stroke="#233347" strokeWidth="3" /> : <><circle cx="27" cy="31" r="4" fill="#243447" /><circle cx="49" cy="31" r="4" fill="#243447" /></>}
    <path d={asleep ? "M32 44h12" : "M29 42q9 10 18 0"} fill="none" stroke="#243447" strokeWidth="3" />
    <rect x="20" y="57" width="36" height="24" rx="6" fill="#7396bb" /><circle cx="38" cy="68" r="4" fill={asleep ? "#96a9bd" : "#c8e9ce"} />
    <path d="M17 63 5 72m54-9 12 9M27 81v7m22-7v7" stroke="#9fb2c8" strokeWidth="6" strokeLinecap="round" />
    {asleep && <text x="55" y="11" fontSize="12" fill="#c6d6ee">Zz</text>}
  </svg>;
}

export default function ParcelFactoryGame({ runtime, view, pending, start, control, error, implementation = "REFERENCE" }) {
  const [mission, setMission] = useState(0);
  const [routing, setRouting] = useState("KEYED");
  const [round, setRound] = useState(null);
  const [shown, setShown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [woke, setWoke] = useState(false);
  const [pauseProof, setPauseProof] = useState(false);
  const [rewound, setRewound] = useState(false);
  const [completed, setCompleted] = useState([]);
  const sceneRef = useRef(null);
  const processing = runtime?.groups.find((group) => group.group === "PROCESSING");
  const audit = runtime?.groups.find((group) => group.group === "AUDIT");
  const current = round && view?.runId === round.runId ? view : null;
  const records = [...(current?.deliveries || [])].sort((a,b) => a.id - b.id);
  const visible = records.slice(0,shown);
  const handled = visible.filter((row) => row.group === "PROCESSING");
  const audited = visible.filter((row) => row.group === "AUDIT");
  const actualHandled = records.filter((row) => row.group === "PROCESSING");
  const actualAudited = records.filter((row) => row.group === "AUDIT");
  const orderIds = [...new Set(records.map((row) => row.orderId))];
  const nameOf = (id) => `택배 ${String.fromCharCode(65 + orderIds.indexOf(id))}`;
  const completeOrders = (list) => orderIds.filter((id) => jobs.every((_,index) => list.some((row) => row.orderId === id && row.sequence === index + 1 && row.outcome === "APPLIED")) && current?.projections.some((row) => row.group === "PROCESSING" && row.orderId === id && row.status === "SHIPPED")).length;
  const delivered = completeOrders(handled);
  const actualDelivered = completeOrders(actualHandled);
  const blocked = handled.filter(ignored).length;
  const gaps = handled.filter((row) => row.outcome === "APPLIED_WITH_GAP").length;
  const seenJobs = new Set(handled.map(keyOf));
  const waiting = audited.filter((row) => !seenJobs.has(keyOf(row)));
  const backendReady = Boolean(round && actualDelivered === round.orders && current.published === round.events);
  const caughtUp = shown >= records.length;
  const played = Boolean(round && caughtUp && delivered === round.orders);
  const cleared = played && (mission === 0 ? round.routing === "KEYED" : mission === 1 ? pauseProof : rewound && blocked > 0);
  const locked = busy || pending || !runtime;
  const playing = Boolean(round && (!caughtUp || !current || records.length < round.events * 2));
  const paused = Boolean(processing?.paused);
  const pausing = Boolean(processing?.pauseRequested && !paused);
  const latest = visible.at(-1);
  const latestJob = handled.at(-1);
  const local = runtime?.mode !== "EXTERNAL_KAFKA";

  // Replay actual saved receipts slowly enough to see. No simulated success or fabricated receipts.
  useEffect(() => {
    if (shown >= records.length) return;
    const timer = window.setTimeout(() => setShown((value) => value + 1), 420);
    return () => window.clearTimeout(timer);
  }, [shown, records.length]);

  const selectMission = (index) => {
    setMission(index); setRound(null); setShown(0); setWoke(false); setPauseProof(false); setRewound(false); setRouting("KEYED");
  };
  const begin = async (count = 1, keepPaused = false) => {
    setBusy(true);
    try {
      if (!keepPaused && !(await control("PROCESSING","resume"))) return;
      if (!(await control("AUDIT","resume"))) return;
      const result = await start({ routing: mission === 0 ? routing : "KEYED", orders:count });
      if (result) { setRound({ ...result, orders:count }); setShown(0); setWoke(false); setPauseProof(false); setRewound(false); }
    } finally { setBusy(false); }
  };
  const wake = async () => {
    setBusy(true);
    try {
      const proof = paused && actualAudited.length >= round.events && actualHandled.length === 0;
      if (await control("PROCESSING","resume")) { setPauseProof(proof); setWoke(true); }
    } finally { setBusy(false); }
  };
  const replay = async () => {
    setBusy(true);
    try {
      if (!(await control("PROCESSING","replay",round.runId))) return;
      setRewound(true);
      if (await control("PROCESSING","resume")) setWoke(true);
    } finally { setBusy(false); }
  };
  const next = () => {
    setCompleted((previous) => [...new Set([...previous,mission])]);
    if (mission < 2) selectMission(mission + 1);
  };

  let action = { label:"① 택배 한 개 보내기", run:() => begin(), disabled:false };
  let hint = "아래 버튼을 눌러 보세요. 택배 한 개에 작업 카드 네 장이 생겨요.";
  if (mission === 0 && round) {
    action = { label:playing ? "작업 카드 처리 중…" : "다른 방법으로 다시 보내기", run:() => begin(), disabled:playing };
    hint = round.routing === "SPREAD" ? "서로 다른 레일은 누가 먼저 처리할지 몰라요. 도착한 번호 순서를 보세요." : "카드가 1 → 2 → 3 → 4 순서로 도착하는지 보세요.";
  }
  if (mission === 1) {
    if (!round) {
      action = paused ? { label:"② 택배 세 개 쌓아두기", run:() => begin(3,true) } : { label:pausing ? "작업자가 멈추는 중…" : "① 작업자 쉬게 하기", run:() => control("PROCESSING","pause"), disabled:pausing };
      hint = paused ? "작업자는 쉬고 있어요. 택배를 보내서 레일 위에 쌓아 보세요." : "먼저 배송 작업자를 쉬게 해요. 장부 직원은 계속 일해요.";
    } else if (paused && !woke) {
      action = { label:"③ 작업자 깨우기", run:wake, disabled:audited.length < round.events || !caughtUp };
      hint = audited.length < round.events ? "장부 직원이 카드를 기록하고 있어요. 택배는 레일에 남아 있어요." : "카드가 그대로 남아 있죠? 작업자를 깨워 밀린 일을 끝내 주세요.";
    } else {
      action = { label:cleared ? "세 택배 모두 처리했어요" : "밀린 택배 처리 중…", disabled:true };
      hint = "쉬는 동안 보관한 카드부터 이어 읽어요. 새로 주문할 필요가 없어요.";
    }
  }
  if (mission === 2 && round) {
    if (!backendReady || !caughtUp) action = { label:"택배가 완료될 때까지 기다려요…", disabled:true };
    else if (!rewound) action = paused ? { label:"③ 끝낸 작업 다시 읽기", run:replay } : { label:pausing ? "되감기 준비 중…" : "② 되감기 준비", run:() => control("PROCESSING","pause"), disabled:pausing };
    else action = paused && !woke ? { label:"작업자 다시 깨우기", run:() => control("PROCESSING","resume") } : { label:cleared ? "중복 작업을 막았어요" : "중복 작업 확인 중…", disabled:true };
    hint = !backendReady ? "먼저 택배 한 개를 정상적으로 끝내세요." : !rewound ? "완료한 작업을 처음부터 다시 읽어 볼까요? 준비 버튼부터 눌러 주세요." : "같은 카드가 다시 와도 이미 처리한 작업이면 막아요. 발송 완료 수는 그대로예요.";
  }
  const feedback = cleared ? `미션 성공! ${missions[mission].lesson}` : latest ? latest.group === "AUDIT" ? `장부 직원: ${nameOf(latest.orderId)}의 ${latest.sequence}번 ${jobs[latest.sequence-1]} 카드 기록 완료.` : ignored(latest) ? `배송 작업자: ${latest.sequence}번 ${jobs[latest.sequence-1]}, 이미 지난 작업이라 통과시키지 않았어요.` : `배송 작업자: ${nameOf(latest.orderId)} ${latest.sequence}번 ${jobs[latest.sequence-1]}${latest.outcome === "APPLIED_WITH_GAP" ? " — 앞 단계가 빠졌어요!" : " 완료!"}` : hint;
  const performAction = async () => {
    await action.run?.();
    sceneRef.current?.scrollIntoView({ behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block:"start" });
  };

  return <section className="parcel-factory" aria-label="택배 공장 미니게임">
    <header className="factory-title"><div><span className="factory-eyebrow">CLICK · WATCH · UNDERSTAND</span><h2>택배를 부탁해!</h2><p>택배 하나, 작업 카드 네 장. 버튼을 누르고 공장을 지켜보세요.</p></div><span className="factory-mode">{implementation === "LEARNER" ? "내 Java 코드" : "완성 예제"} · {!runtime ? "연결 중" : local ? "로컬 연습" : "실제 Kafka"}</span></header>
    <nav className="factory-missions" aria-label="게임 미션">{missions.map((item,index) => <button key={item.title} aria-pressed={mission === index} className={mission === index ? "active" : ""} disabled={locked} onClick={() => selectMission(index)}><span>{completed.includes(index) || (mission === index && cleared) ? "★" : `0${index+1}`}</span><strong>{item.title}</strong></button>)}</nav>
    <div className="factory-instruction"><span>MISSION 0{mission+1}</span><h3>{missions[mission].goal}</h3><div className="factory-recipe">{jobs.map((job,index) => <span key={job}><b>{index+1}</b>{job}{index < 3 && <i aria-hidden="true">→</i>}</span>)}</div></div>
    <div className="factory-play-area" ref={sceneRef}>
      <div className="factory-floor-heading"><span><i className={runtime ? "online" : ""} />{cleared ? "★ 미션 성공!" : paused ? "작업자 휴식 중" : pausing ? "작업자 멈추는 중" : playing ? "공장 가동 중" : "공장 대기 중"}</span><button disabled={locked || (!cleared && action.disabled)} onClick={cleared ? mission < 2 ? next : () => { next(); selectMission(0); } : performAction}>{locked ? "연결 확인 중…" : cleared ? mission < 2 ? "다음 미션 →" : "처음부터 다시 놀기 ↻" : action.label}</button></div>
      <div className="factory-floor">
        <div className="factory-source"><span className="factory-source-box" aria-hidden="true">▣</span><strong>주문 접수</strong><small>{round ? `택배 ${round.orders}개` : "버튼을 눌러 시작"}</small><span>{current?.published ?? 0} / {round?.events ?? 0}장 기록</span></div>
        <div className="factory-conveyors">{[0,1,2].map((lane) => {
          const laneJobs = handled.filter((row) => row.partition === lane).slice(-4);
          const queued = waiting.filter((row) => row.partition === lane);
          const activeJob = latestJob?.partition === lane && !caughtUp;
          return <div className="factory-conveyor-row" key={lane} style={{"--belt-color":["#e4b679","#93b9ed","#a7cba1"][lane]}}>
            <span className="factory-lane-name">레일 {lane+1}</span>
            <div className={`factory-belt ${paused || !playing ? "stopped" : ""}`}>
              {!paused && latest?.group === "PROCESSING" && latest.partition === lane && <span key={latest.id} className={`factory-moving-job ${ignored(latest) ? "rejected" : ""}`} aria-hidden="true">{ignored(latest) ? "×" : latest.sequence}</span>}
              {paused && queued.length ? queued.slice(0,6).map((row) => <div className="factory-job waiting" key={row.id}><b>{row.sequence}</b><small>{jobs[row.sequence-1]}</small></div>) : laneJobs.length ? laneJobs.map((row) => <div key={row.id} className={`factory-job ${ignored(row) ? "blocked" : row.outcome === "APPLIED_WITH_GAP" ? "gap" : "passed"}`}><b>{ignored(row) ? "×" : row.sequence}</b><small>{ignored(row) ? "중복·과거" : jobs[row.sequence-1]}</small></div>) : <span className="factory-belt-empty">{paused ? "카드를 쌓아 보세요" : "카드가 오면 움직여요"}</span>}
            </div><div className="factory-worker-slot"><Bot asleep={paused} working={activeJob && !paused} /><span>{paused ? "Zzz…" : activeJob ? "처리 중!" : "준비!"}</span></div>
          </div>;
        })}</div>
        <div className="factory-destination"><div className={`factory-delivery-truck ${delivered ? "has-delivery" : ""}`} aria-hidden="true"><span>▣</span><i /><i /></div><strong>정상 발송</strong><b>{delivered}<small> / {round?.orders ?? 0}개</small></b><span>네 단계를 모두 완료한 택배</span></div>
      </div>
      <div className="factory-bookkeeper"><span aria-hidden="true">▤</span><div><strong>장부 직원</strong><p>{audit?.paused ? "지금은 장부 직원도 쉬고 있어요." : "배송 작업자가 쉬어도 따로 기록해요."}</p></div><b>{audited.length}<small>장 기록</small></b></div>
    </div>
    <section className="factory-action-panel" aria-label="지금 할 일"><div><span>지금 할 일</span><p>{hint}</p></div>
      {mission === 0 && <fieldset className="factory-route-choice" disabled={locked || playing}><legend>작업 카드를 어디로 보낼까요?</legend><label><input type="radio" name="factory-routing" checked={routing === "KEYED"} onChange={() => setRouting("KEYED")} /><span><strong>한 레일에 모으기</strong><small>같은 택배끼리 줄 서요</small></span></label><label><input type="radio" name="factory-routing" checked={routing === "SPREAD"} onChange={() => setRouting("SPREAD")} /><span><strong>여러 레일로 나누기</strong><small>누가 먼저 끝날까요?</small></span></label></fieldset>}
      <button className="factory-primary" disabled={locked || action.disabled} onClick={performAction}>{locked ? !runtime ? "서버 연결을 기다리는 중…" : "공장에 요청 중…" : action.label}<span aria-hidden="true">→</span></button>
    </section>
    <div className={`factory-live-feedback ${cleared ? "success" : ""}`} role="status"><span aria-hidden="true">{error ? "!" : cleared ? "★" : "◉"}</span><p>{error || feedback}</p></div>
    {round && <section className="factory-order-board" aria-label="이번 택배 처리 기록"><header><strong>실제로 도착한 작업 순서</strong><span>{caughtUp ? "최신 기록까지 재생 완료" : "서버 처리 기록을 한 장씩 재생 중"}</span></header>{orderIds.length ? orderIds.map((id) => <div className="factory-order-line" key={id}><b>{nameOf(id)}</b><div>{handled.filter((row) => row.orderId === id).map((row) => <span key={row.id} className={ignored(row) ? "ignored" : row.outcome === "APPLIED_WITH_GAP" ? "out-of-order" : ""}>{row.sequence}<small>{ignored(row) ? "차단" : jobs[row.sequence-1]}</small></span>)}</div></div>) : <p>작업 기록을 기다리는 중…</p>}</section>}
    <div className="factory-score"><span>정상 발송 <b>{delivered}개</b></span><span>장부 기록 <b>{audited.length}장</b></span><span>중복·과거 작업 차단 <b>{blocked}장</b></span><span>앞 단계 누락 <b>{gaps}회</b></span></div>
    {cleared && <div className="factory-clear"><div><strong>{mission === 2 ? new Set([...completed,mission]).size === 3 ? "세 가지 실험을 모두 해냈어요!" : "중복 배송 방어 성공!" : "잘했어요! 다음 공장도 가볼까요?"}</strong><p>{missions[mission].lesson}</p></div>{mission < 2 ? <button onClick={next} disabled={locked}>다음 미션 →</button> : <button onClick={() => { next(); selectMission(0); }} disabled={locked}>처음부터 다시 놀기 ↻</button>}</div>}
    {mission === 0 && round?.routing === "SPREAD" && caughtUp && actualHandled.length >= round.events && <p className="factory-discovery">{gaps ? "앞 번호보다 뒷 번호가 먼저 왔어요! 한 레일에 모아서 다시 보내 보세요." : "이번에는 순서가 맞았어도 여러 레일 사이의 순서는 보장되지 않아요. 한 레일에 모으는 방법도 비교해 보세요."}</p>}
    <details className="factory-explanation"><summary>방금 한 일이 Kafka에서는 무슨 뜻일까요?</summary><p>{missions[mission].kafka}</p><p>{local ? "현재는 서버 내부의 로컬 모형입니다. 레일을 3 → 2 → 1 순서로 읽도록 만들어 순서 차이를 쉽게 관찰할 수 있어요. 실제 Kafka 실행은 external 모드에서 가능합니다." : "현재 실제 Kafka에 요청하고 있습니다. 화면은 저장된 처리 기록을 천천히 재생하며, 실제 서버 처리 속도와는 다릅니다."}</p></details>
    <p className="factory-disclosure">그림은 이번 주문의 실제 처리 기록을 0.42초 간격으로 재생합니다. 성공 판정은 서버의 처리 결과와 최종 상태를 함께 확인합니다. 전체 공장 대기량은 아래 기술 화면에서 확인할 수 있어요.</p>
  </section>;
}
