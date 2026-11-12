import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getArchitecture } from "../../data/architectures";
import "../../styles/Architecture.css";

const kinds = {
  browser: "화면",
  process: "처리",
  database: "DB",
  queue: "이벤트",
  worker: "소비자",
  shield: "검증",
  memory: "메모리",
  compute: "연산",
  chart: "결과",
  cache: "캐시",
  key: "토큰",
  code: "로직",
  remote: "외부 연결",
  folder: "파일",
  branch: "트리",
  object: "산출물 저장",
};
const icons = {
  object: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5v5" />
    </>
  ),
  browser: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01M7 13h5m-5 3h9" />
    </>
  ),
  process: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="4" />
      <path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3M9 9h6v6H9z" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0" />
    </>
  ),
  queue: (
    <>
      <rect x="2" y="8" width="5" height="8" rx="1" />
      <rect x="9.5" y="5" width="5" height="14" rx="1" />
      <rect x="17" y="8" width="5" height="8" rx="1" />
      <path d="M4 4h16M18 2l2 2-2 2" />
    </>
  ),
  worker: (
    <>
      <path d="M12 2v3M9 2h6" />
      <rect x="4" y="5" width="16" height="13" rx="4" />
      <path d="M8 10h.01m8 0h.01M9 14h6M8 18v4m8-4v4M1 10h3m16 0h3" />
    </>
  ),
  shield: (
    <>
      <path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  memory: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 9v6m5-6v6m5-6v6M6 3v3m6-3v3m6-3v3M6 18v3m6-3v3m6-3v3" />
    </>
  ),
  compute: (
    <>
      <path d="m13 2-9 12h7l-1 8 10-13h-8z" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18M7 16l4-5 4 2 6-8M17 5h4v4" />
    </>
  ),
  cache: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 4 16 4 16 0V5m-7 4-4 6h5l-2 5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="5" />
      <path d="m12 12 9 9m-5-5 3-3m0 6 3-3M7 7h.01" />
    </>
  ),
  code: (
    <>
      <path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18" />
    </>
  ),
  remote: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18M5 6h14M5 18h14" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7V4h7l3 3h8v13H3zM3 10h18" />
    </>
  ),
  branch: (
    <>
      <rect x="8" y="2" width="8" height="6" rx="1" />
      <path d="M12 8v5M5 17v-4h14v4" />
      <rect x="2" y="17" width="6" height="5" rx="1" />
      <rect x="16" y="17" width="6" height="5" rx="1" />
    </>
  ),
};

/** 아키텍처 요소 종류에 맞는 SVG 아이콘을 렌더링합니다. */
function Icon({ kind, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {icons[kind] || icons.process}
    </svg>
  );
}

/** 노드 위치와 연결 종류로 구조도 선의 경로와 화살표 위치를 계산합니다. */
function connection(from, to, edge, width, height, index) {
  const a = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const b = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  let path, label;
  if (edge.route === "bottom") {
    const y = height - 18 - (index % 2) * 12;
    path = `M ${a.x} ${from.y + from.height} V ${y} H ${b.x} V ${to.y + to.height}`;
    label = { x: (a.x + b.x) / 2, y: y - 10 };
  } else if (edge.route === "top") {
    const y = 48;
    path = `M ${a.x} ${from.y} V ${y} H ${b.x} V ${to.y}`;
    label = { x: (a.x + b.x) / 2, y: y - 9 };
  } else if (edge.route === "right") {
    const x = width - 12,
      y = height - 18;
    path = `M ${from.x + from.width} ${a.y} H ${x} V ${y} H ${b.x} V ${to.y + to.height}`;
    label = { x: (x + b.x) / 2, y: y - 10 };
  } else if (Math.abs(a.y - b.y) < 10) {
    const sx = a.x < b.x ? from.x + from.width : from.x,
      tx = a.x < b.x ? to.x : to.x + to.width;
    path = `M ${sx} ${a.y} C ${(sx + tx) / 2} ${a.y}, ${(sx + tx) / 2} ${b.y}, ${tx} ${b.y}`;
    label = { x: (sx + tx) / 2, y: a.y - 13 };
  } else {
    const sy = a.y < b.y ? from.y + from.height : from.y,
      ty = a.y < b.y ? to.y : to.y + to.height;
    path = `M ${a.x} ${sy} C ${a.x} ${(sy + ty) / 2}, ${b.x} ${(sy + ty) / 2}, ${b.x} ${ty}`;
    label = { x: (a.x + b.x) / 2, y: (sy + ty) / 2 - 10 };
  }
  return { path, label };
}

/** 기능 구조도와 단계 재생, 선택한 요소의 소스 연결을 표시합니다. */
export default function ArchitectureView({ item, compact = false }) {
  const [mode, setMode] = useState("local");
  const profile = useMemo(() => getArchitecture(item.id, mode), [item.id, mode]);
  const [selectedId, setSelectedId] = useState(profile.tour[0].id);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [listView, setListView] = useState(false);
  const [geometry, setGeometry] = useState(null);
  const boardRef = useRef(null);
  const prefix = useId().replaceAll(":", "");
  const selected = profile.nodes.find((node) => node.id === selectedId) || profile.nodes[0];
  const sources = item.sources
    .map((file, index) => ({ ...file, index }))
    .filter((file) => selected.files.some((name) => file.path.endsWith(`/${name}`)));
  const rows = Math.max(...profile.nodes.map((node) => node.row)) + 1;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(step + 1, profile.tour.length - 1);
      setStep(next);
      setSelectedId(profile.tour[next].id);
      if (next === profile.tour.length - 1) setPlaying(false);
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [playing, step, profile]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board || compact || listView) return;
    let frame;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = board.getBoundingClientRect();
        const nodes = {};
        board.querySelectorAll("[data-architecture-node]").forEach((element) => {
          const rect = element.getBoundingClientRect();
          nodes[element.dataset.architectureNode] = {
            x: rect.left - box.left,
            y: rect.top - box.top,
            width: rect.width,
            height: rect.height,
          };
        });
        setGeometry({ width: board.clientWidth, height: board.clientHeight, nodes });
      });
    });
    observer.observe(board);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [compact, listView, profile]);

  /** 구조도 설명의 단계를 이동하고 해당 요소를 선택합니다. */
  const go = (index) => {
    const next = Math.max(0, Math.min(index, profile.tour.length - 1));
    setPlaying(false);
    setStep(next);
    setSelectedId(profile.tour[next].id);
  };

  /** 선택 상태를 바꾸고 현재 단계에 연결된 화면을 갱신합니다. */
  const choose = (id) => {
    setPlaying(false);
    setSelectedId(id);
    const index = profile.tour.findIndex((entry) => entry.id === id);
    if (index >= 0) setStep(index);
  };

  /** 구조도 흐름 설명의 자동 재생을 시작하거나 멈춥니다. */
  const togglePlay = () => {
    if (step === profile.tour.length - 1) {
      setStep(0);
      setSelectedId(profile.tour[0].id);
    }
    setPlaying((value) => !value);
  };

  if (compact)
    return (
      <div className="arch-preview" aria-label={`${item.title} 핵심 구조`}>
        <div className="arch-preview-grid">
          {profile.preview.map((id, index) => {
            const node = profile.nodes.find((entry) => entry.id === id);
            return (
              <div className={`arch-preview-node tone-${node.kind}`} key={id}>
                <span className="arch-icon">
                  <Icon kind={node.kind} />
                </span>
                <span className="arch-preview-number">0{index + 1}</span>
                <strong>{node.title}</strong>
                <small>{kinds[node.kind]}</small>
              </div>
            );
          })}
        </div>
        <p>{profile.summary}</p>
      </div>
    );

  return (
    <div className="arch-view">
      <header className="arch-heading">
        <div>
          <span className="arch-eyebrow">IMPLEMENTATION AT A GLANCE</span>
          <h2>{profile.title}</h2>
          <p>{profile.summary}</p>
        </div>
        <span className="arch-node-count">
          {profile.nodes.length}개 요소 · {profile.edges.length}개 연결
        </span>
      </header>
      <div className="arch-toolbar">
        {profile.modes && (
          <div className="arch-modes" aria-label="설명할 구성 선택">
            {[
              ["local", "로컬 구성"],
              ["external", item.id === "gw-sync" ? "Kafka · Redis 구성" : "Kafka 구성"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  go(0);
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="arch-view-toggle" aria-label="구조 표시 방식">
          <button aria-pressed={!listView} onClick={() => setListView(false)}>
            ⌗ 그림
          </button>
          <button aria-pressed={listView} onClick={() => setListView(true)}>
            ≡ 목록
          </button>
        </div>
        <span>
          {item.kind === "guide"
            ? "향후 배포를 위한 참고 설계"
            : profile.modes
              ? "구조 설명용 선택 · 서버 설정은 유지됩니다"
              : "현재 구현을 기준으로 한 구조도"}
        </span>
      </div>
      <section className="arch-walkthrough" aria-label="흐름 따라보기">
        <div className="arch-player">
          <button className="arch-play" onClick={togglePlay}>
            {playing
              ? "Ⅱ 일시정지"
              : step === profile.tour.length - 1
                ? "↻ 처음부터 재생"
                : "▶ 흐름 따라보기"}
          </button>
          <button aria-label="이전 단계" onClick={() => go(step - 1)} disabled={step === 0}>
            ←
          </button>
          <span>
            {step + 1} / {profile.tour.length}
          </span>
          <button
            aria-label="다음 단계"
            onClick={() => go(step + 1)}
            disabled={step === profile.tour.length - 1}
          >
            →
          </button>
        </div>
        <p aria-live={playing ? "off" : "polite"}>{profile.tour[step].text}</p>
      </section>
      {listView ? (
        <ol className="arch-accessible-list">
          {profile.tour.map((entry, index) => {
            const node = profile.nodes.find((node) => node.id === entry.id);
            return (
              <li key={`${entry.id}-${index}`}>
                <button
                  className={selectedId === node.id ? "selected" : ""}
                  onClick={() => choose(node.id)}
                >
                  <Icon kind={node.kind} />
                  <span>
                    <strong>
                      {index + 1}. {node.title}
                    </strong>
                    <small>{entry.text}</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div
          className="arch-scroll"
          role="region"
          aria-label="구조도. 좁은 화면에서는 좌우로 스크롤하거나 목록 보기를 선택하세요."
          tabIndex={0}
        >
          <div className="arch-board" ref={boardRef} style={{ "--arch-rows": rows }}>
            <div className="arch-columns">
              {profile.columns.map((column, index) => (
                <div key={column}>
                  <span>0{index + 1}</span>
                  {column}
                </div>
              ))}
            </div>
            <svg
              className="arch-connectors"
              width={geometry?.width || "100%"}
              height={geometry?.height || "100%"}
              aria-hidden="true"
            >
              <defs>
                {["sync", "async", "read", "setup", "remote"].map((kind) => (
                  <marker
                    key={kind}
                    id={`${prefix}-${kind}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <path d="M0 0 8 4 0 8z" className={`arch-arrow-${kind}`} />
                  </marker>
                ))}
              </defs>
              {geometry &&
                profile.edges.map((edge, index) => {
                  const from = geometry.nodes[edge.from],
                    to = geometry.nodes[edge.to];
                  if (!from || !to) return null;
                  const active = edge.from === selectedId || edge.to === selectedId;
                  const { path, label } = connection(
                    from,
                    to,
                    edge,
                    geometry.width,
                    geometry.height,
                    index,
                  );
                  const text = edge.label.length > 10 ? `${edge.label.slice(0, 9)}…` : edge.label;
                  return (
                    <g
                      key={`${edge.from}-${edge.to}`}
                      className={`arch-edge edge-${edge.kind} ${active ? "active" : ""}`}
                    >
                      <title>{edge.label}</title>
                      <path d={path} markerEnd={`url(#${prefix}-${edge.kind})`} />
                      {active && (
                        <>
                          <rect x={label.x - 34} y={label.y - 9} width="68" height="18" rx="5" />
                          <text x={label.x} y={label.y + 3} textAnchor="middle">
                            {text}
                          </text>
                          <circle className="arch-signal" r="3">
                            <animateMotion dur="1.8s" repeatCount="indefinite" path={path} />
                          </circle>
                        </>
                      )}
                    </g>
                  );
                })}
            </svg>
            <div className="arch-node-grid">
              {profile.nodes.map((node, index) => (
                <button
                  key={node.id}
                  data-architecture-node={node.id}
                  className={`arch-node tone-${node.kind} shape-${node.kind} ${selectedId === node.id ? "selected" : ""}`}
                  style={{ gridColumn: node.col + 1, gridRow: node.row + 1 }}
                  onClick={() => choose(node.id)}
                  aria-pressed={selectedId === node.id}
                >
                  <span className="arch-node-top">
                    <span className="arch-icon">
                      <Icon kind={node.kind} />
                    </span>
                    <small>{kinds[node.kind]}</small>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </span>
                  <strong>{node.title}</strong>
                  <code>{node.code}</code>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="arch-legend">
        <span>
          <i />
          호출·결과
        </span>
        <span>
          <i className="async" />
          이벤트·비동기
        </span>
        <span>
          <i className="read" />
          데이터 조회·반환
        </span>
        <span>
          <i className="setup" />
          시작 시 준비
        </span>
        {item.id === "capacity" && (
          <span>
            <i className="remote" />
            외부 SSH
          </span>
        )}
        <p>요소를 누르면 역할과 관련 소스를 볼 수 있습니다.</p>
      </div>
      <section className={`arch-detail tone-${selected.kind}`} aria-label="선택한 요소의 구현">
        <div className="arch-detail-description">
          <span className="arch-detail-kicker">
            <Icon kind={selected.kind} />
            {kinds[selected.kind]} · SELECTED COMPONENT
          </span>
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>
          <code>{selected.code}</code>
          <ul className="arch-related-edges">
            {profile.edges
              .filter((edge) => edge.from === selectedId || edge.to === selectedId)
              .map((edge) => (
                <li key={`${edge.from}-${edge.to}`}>
                  <span>{edge.label}</span>
                  {profile.nodes.find((node) => node.id === edge.from).title} →{" "}
                  {profile.nodes.find((node) => node.id === edge.to).title}
                </li>
              ))}
          </ul>
        </div>
        <div className="arch-detail-sources">
          <h4>구현 소스 열기</h4>
          {sources.length ? (
            sources.map((file) => (
              <Link key={file.path} to={`/inventory/${item.id}?tab=source&file=${file.index}`}>
                <span className="arch-source-icon">{file.path.endsWith(".java") ? "J" : "⌘"}</span>
                <span>
                  <strong>{file.path.split("/").pop()}</strong>
                  <small>
                    {item.kind === "guide"
                      ? file.path.endsWith(".md")
                        ? "참고 문서"
                        : "배포 설정·스크립트"
                      : file.path.endsWith(".java")
                        ? "Java 구현"
                        : "화면·SQL 구현"}
                  </small>
                </span>
                <span>↗</span>
              </Link>
            ))
          ) : (
            <p>
              이 요소는 연결된 서비스 내부에서 구현됩니다. 다른 요소를 선택하면 해당 구현 파일을
              확인할 수 있습니다.
            </p>
          )}
        </div>
      </section>
      <section className="arch-data-section" aria-label="저장 위치와 접근 방식">
        <header>
          <Icon kind="database" />
          <h3>무엇을 어디에 저장하나요?</h3>
        </header>
        <div>
          {profile.stores.map((store) => (
            <article key={store.name}>
              <Icon
                kind={
                  store.engine.includes("S3")
                    ? "object"
                    : store.engine.includes("파일")
                      ? "folder"
                      : store.engine.includes("메모리") || store.engine === "sessionStorage"
                        ? "memory"
                        : "database"
                }
              />
              <span>{store.engine}</span>
              <h4>{store.name}</h4>
              <p>{store.description}</p>
            </article>
          ))}
        </div>
      </section>
      <p className="arch-note">
        <span>i</span>
        {profile.note}
      </p>
      <p className="arch-disclosure">
        강조 표시와 흐름 재생은 이해를 돕는 설명용 애니메이션입니다. 실행 결과나 서버의 실시간
        상태를 표시하지 않습니다.
      </p>
    </div>
  );
}
