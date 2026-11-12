import { useEffect, useState } from "react";
import api from "../../api/axios";
import "../../styles/GwSync.css";

const sourceColumns = [
  { key: "id", column: "id", label: "원본 ID", type: "VARCHAR(36)" },
  {
    key: "name",
    column: "name",
    label: "이름",
    type: "VARCHAR(100)",
    maxLength: 100,
    editable: true,
  },
  {
    key: "description",
    column: "description",
    label: "설명",
    type: "VARCHAR(2000)",
    maxLength: 2000,
    editable: true,
  },
  { key: "revision", column: "revision", label: "변경 버전", type: "BIGINT" },
  {
    key: "publishedRevision",
    column: "published_revision",
    label: "발행 확인 버전",
    type: "BIGINT",
  },
  { key: "deleted", column: "deleted", label: "삭제 여부", type: "BOOLEAN" },
  {
    key: "updatedAt",
    column: "updated_at",
    label: "변경 시각",
    type: "TIMESTAMP",
  },
];
const targetColumns = [
  ...sourceColumns.filter((field) => !["publishedRevision", "updatedAt"].includes(field.key)),
  {
    key: "sourceUpdatedAt",
    column: "source_updated_at",
    label: "원본 변경 시각",
    type: "TIMESTAMP",
  },
  {
    key: "syncedAt",
    column: "synced_at",
    label: "대상 반영 시각",
    type: "TIMESTAMP",
  },
];

/** GW 원본의 컬럼 하나를 직접 입력할 필드를 표시합니다. */
function ColumnInput({ field, value, editable = false, disabled = false, onChange, group }) {
  return (
    <label className="gw-column-field">
      <span>
        <code>{field.column}</code>
        <small>
          {field.label} · {field.type}
        </small>
        <em>{editable ? "직접 입력" : "자동"}</em>
      </span>
      <input
        aria-label={`${group} ${field.column} · ${field.label}`}
        value={value == null ? "" : String(value)}
        placeholder={editable ? `${field.label} 입력` : "저장·연동 후 자동 반영"}
        readOnly={!editable}
        disabled={editable && disabled}
        maxLength={field.maxLength}
        required={editable && field.key === "name"}
        onChange={editable ? (event) => onChange(event.target.value) : undefined}
      />
    </label>
  );
}

/** 원본·대상·캐시의 형상을 컬럼 단위로 비교해 표시합니다. */
function SnapshotBlock({ title, label, value }) {
  return (
    <article className="gw-snapshot">
      <header>
        <h3>{title}</h3>
        <span>{label}</span>
      </header>
      <div className="gw-column-fields">
        {targetColumns.map((field) => (
          <ColumnInput key={field.key} field={field} value={value?.[field.key]} group={title} />
        ))}
      </div>
      {!value && <p className="gw-column-empty">아직 반영된 데이터가 없습니다.</p>}
      {value && (
        <details className="gw-raw-snapshot">
          <summary>JSON 원문</summary>
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </details>
      )}
    </article>
  );
}

/** 원본 입력과 DB·캐시 상태 비교로 GW 연동을 실험할 화면을 표시합니다. */
export default function GwSyncPage() {
  const [configuration, setConfiguration] = useState(null);
  const [recent, setRecent] = useState([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("GW 연동 예제");
  const [description, setDescription] = useState(
    "원본의 변경 사항을 대상 테이블로 전달하고 형상을 캐시에 보관합니다.",
  );
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.get("/gw-sync/status", { signal: controller.signal }),
      api.get("/gw-sync/items", { signal: controller.signal }),
    ])
      .then(([config, items]) => {
        setConfiguration(config.data);
        setRecent(items.data);
        setError("");
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") setError("백엔드 연결을 확인하세요.");
      });
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    let fetching = false;

    /** 선택한 GW 항목의 원본·대상·캐시 상태를 다시 조회합니다. */
    const refresh = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const [detail, items] = await Promise.all([
          api.get(`/gw-sync/items/${selected}`, { signal: controller.signal }),
          api.get("/gw-sync/items", { signal: controller.signal }),
        ]);
        setState(detail.data);
        setRecent(items.data);
        setError("");
      } catch (error) {
        if (error.code !== "ERR_CANCELED")
          setError(error.response?.data?.message || "연동 상태를 조회하지 못했습니다.");
      } finally {
        fetching = false;
      }
    };
    refresh();
    const timer = setInterval(refresh, 2500);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [selected, reload]);

  /** 조회할 GW 항목을 선택하고 입력 및 비교 상태를 갱신합니다. */
  const select = (id) => {
    const item = recent.find((item) => item.id === id);
    setSelected(id);
    setState(null);
    if (item) {
      setName(item.name);
      setDescription(item.description);
    }
  };

  /** 원본 생성·수정·삭제 요청을 보내고 연동 결과를 다시 조회합니다. */
  const write = async (operation) => {
    setPending(true);
    setError("");
    try {
      const payload = { name, description };
      const response =
        operation === "create"
          ? await api.post("/gw-sync/items", payload)
          : operation === "update"
            ? await api.put(`/gw-sync/items/${selected}`, payload)
            : await api.delete(`/gw-sync/items/${selected}`);
      setSelected(response.data.id);
      setState(null);
      setReload((value) => value + 1);
    } catch (error) {
      setError(error.response?.data?.message || "요청에 실패했습니다.");
    } finally {
      setPending(false);
    }
  };
  const disabled = !configuration?.enabled || pending;
  const selectedItem = recent.find((item) => item.id === selected);
  const deleted = state?.source.deleted || selectedItem?.deleted;
  const isLocal = (configuration?.mode ?? "LOCAL") === "LOCAL";
  const transport = isLocal ? "내부 이벤트" : "Kafka";
  const cacheName = isLocal ? "메모리 캐시" : "Redis";
  const storedSource = state?.source ?? selectedItem;
  return (
    <div className="gw-page">
      <header className="gw-heading">
        <span>
          {configuration
            ? isLocal
              ? "JPA / LOCAL EVENTS / MEMORY CACHE"
              : "JPA / KAFKA / REDIS"
            : "연동 설정 확인 중"}
        </span>
        <h2>GW 데이터 연동</h2>
        <p>
          원본 테이블 → {transport} → 대상 테이블 → {cacheName} JSON 스냅샷
        </p>
      </header>
      <div className="gw-flow" aria-label="데이터 연동 흐름">
        <span>
          gw_source <b>원본 · JPA</b>
        </span>
        <i>→</i>
        <span>
          {transport} <b>ID · revision</b>
        </span>
        <i>→</i>
        <span>
          gw_target <b>대상 · JPA</b>
        </span>
        <i>→</i>
        <span>
          {cacheName} <b>형상 캐시 · TTL {configuration?.cacheTtlSeconds ?? "—"}초</b>
        </span>
      </div>
      <div className="gw-configuration">
        <strong>
          {!configuration
            ? "설정 확인 중"
            : !configuration.enabled
              ? "연동 설정 비활성"
              : isLocal
                ? "LOCAL DEMO · 외부 서버 없이 실행"
                : "EXTERNAL · Kafka / Redis"}
        </strong>
        <code>
          {configuration
            ? isLocal
              ? "Spring Events · ConcurrentHashMap"
              : configuration.topic
            : "—"}
        </code>
        <button onClick={() => setReload((value) => value + 1)} disabled={pending}>
          상태 새로고침
        </button>
      </div>
      <p className="gw-caption">
        {isLocal
          ? "로컬 데모입니다. 실제 Kafka·Redis에 연결하지 않고 프로젝트 내부 이벤트와 메모리 캐시를 사용합니다."
          : "외부 연동 모드입니다. 활성 표시는 설정값이며, Kafka 수신은 대상 revision과 Redis 캐시 상태로 확인합니다."}
      </p>
      {configuration && !configuration.enabled && (
        <div className="gw-setup">
          <strong>GW 연동 기능이 비활성화되어 있습니다</strong>
          <pre>{"GW_SYNC_ENABLED=true\nGW_SYNC_MODE=local\n# 환경 변수 지정 후 백엔드 재실행"}</pre>
          <p>
            로컬 모드는 외부 서비스 없이 사용할 수 있습니다. 실제 Kafka·Redis를 사용하려면
            GW_SYNC_MODE=external로 지정하세요.
          </p>
        </div>
      )}
      {error && (
        <p className="gw-error" role="alert">
          {error}
        </p>
      )}
      <div className="gw-controls">
        <label>
          최근 원본 20개
          <select
            value={selected}
            onChange={(event) => select(event.target.value)}
            disabled={pending}
          >
            <option value="">새 원본 작성</option>
            {recent.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · v{item.revision}
                {item.deleted ? " · 삭제됨" : ""} · {item.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => {
            select("");
            setName("GW 연동 예제");
            setDescription("");
          }}
          disabled={pending}
        >
          새 항목
        </button>
      </div>
      {state && (
        <div className="gw-result-status" role="status">
          <strong>
            {state.synchronizedData ? "저장된 두 테이블 버전 일치" : `${transport} 반영 대기`}
          </strong>
          <span>
            원본 v{state.source.revision} / 발행 확인 v{state.source.publishedRevision} / 대상 v
            {state.target?.revision ?? "—"}
          </span>
          <span>
            {cacheName}: {state.cache?.state ?? "—"} · TTL {state.cache?.ttlSeconds ?? "—"}초
          </span>
        </div>
      )}
      <p className="gw-caption">
        원본의 name·description 컬럼에 직접 입력한 뒤 저장하세요. 대상·캐시는 연동 결과이며,
        ID·버전·처리 시각은 자동으로 관리합니다.
      </p>
      <form
        className="gw-form gw-column-form"
        onSubmit={(event) => {
          event.preventDefault();
          write(selected ? "update" : "create");
        }}
      >
        <div className="gw-snapshots">
          <article className="gw-snapshot gw-source-editor">
            <header>
              <h3>원본 DB · 입력</h3>
              <span>gw_source</span>
            </header>
            <div className="gw-column-fields">
              {sourceColumns.map((field) => (
                <ColumnInput
                  key={field.key}
                  field={field}
                  group="원본"
                  value={
                    field.key === "name"
                      ? name
                      : field.key === "description"
                        ? description
                        : storedSource?.[field.key]
                  }
                  editable={field.editable}
                  disabled={disabled || deleted}
                  onChange={field.key === "name" ? setName : setDescription}
                />
              ))}
            </div>
            {storedSource && (
              <details className="gw-raw-snapshot">
                <summary>저장된 JSON 원문</summary>
                <pre>{JSON.stringify(storedSource, null, 2)}</pre>
              </details>
            )}
          </article>
          <SnapshotBlock title="대상 DB" label="gw_target" value={state?.target} />
          <SnapshotBlock
            title={`${cacheName} 형상`}
            label={state?.cache?.state ?? "연동 대기"}
            value={state?.cache?.snapshot}
          />
        </div>
        <div className="gw-actions">
          <button type="submit" disabled={disabled || deleted || !name.trim()}>
            {pending
              ? "저장 중..."
              : selected
                ? "원본 수정 → 변경 이벤트"
                : "원본 생성 → 변경 이벤트"}
          </button>
          {selected && (
            <button
              type="button"
              className="gw-delete"
              disabled={disabled || deleted}
              onClick={() => write("delete")}
            >
              삭제 이벤트 전송
            </button>
          )}
        </div>
      </form>
      {state && (
        <>
          <p className="gw-caption">
            캐시 키: <code>{state.cache?.key}</code> · 2.5초마다 상태 조회 · 입력 중인 내용은
            유지됩니다.
          </p>
        </>
      )}
      {!state && (
        <p className="gw-empty">
          원본을 생성하거나 기존 항목을 선택하면 두 테이블과 캐시의 형상을 비교할 수 있습니다.
        </p>
      )}
      <details className="gw-notes">
        <summary>연동 규칙 · 장애 처리 · 예제 범위</summary>
        <ul>
          <li>
            원본과 발행 대기 revision을 같은 DB 트랜잭션으로 저장합니다. 스케줄러가 이벤트 전달 확인
            후 발행 버전을 갱신하며, 실패한 건은 다음 주기에 재시도합니다.
          </li>
          <li>
            원본 ID로 이벤트를 연결합니다. 외부 모드는 Kafka key에도 같은 ID를 사용합니다. 대상은
            revision이 더 큰 이벤트만 반영합니다. 빠른 연속 변경은 최신 형상으로 합쳐질 수 있으며
            모든 중간 변경의 이력 보관은 하지 않습니다.
          </li>
          <li>
            삭제는 두 테이블에 삭제 표시를 남깁니다. 오래된 이벤트가 삭제된 데이터를 되살리지 않도록
            revision을 유지합니다.
          </li>
          <li>
            {isLocal
              ? "로컬 모드는 Spring 내부 이벤트로 전달하며 처리 실패 시 다음 주기에 다시 시도합니다. 브로커·파티션·오프셋·DLT는 사용하지 않습니다."
              : "외부 모드의 수신 실패는 재시도 후 .DLT 토픽으로 격리합니다. DLT는 자동 재처리하지 않습니다. 원인을 수정하고 원본을 다시 수정하면 최신 revision이 발행됩니다."}
          </li>
          <li>
            {isLocal
              ? "대상 DB 커밋 후 메모리에 JSON 형상을 저장합니다. ConcurrentHashMap의 원자적 버전 비교로 오래된 쓰기를 막으며 TTL이 지나면 DB에서 다시 채웁니다."
              : "대상 DB 커밋 후 Redis에 JSON 형상을 저장합니다. Lua로 버전을 비교하며 오래된 쓰기를 막습니다. Redis 장애 시 DB 형상을 반환하며 기존 캐시는 TTL까지 뒤처질 수 있습니다."}
          </li>
          <li>
            이 화면은 형상 비교를 위해 원본·대상 DB를 직접 조회합니다. 형상 캐시 상태는 별도로
            표시하며 DB 조회 성능 비교 화면은 아닙니다.
          </li>
          <li>
            현재는 같은 H2 메모리 DB의 두 테이블을 연결하는 로컬 예제입니다. 서버 재시작 시 DB와
            메모리 캐시는 초기화됩니다. 외부 모드에서 이전 Kafka 이벤트의 원본이 없으면 건너뜁니다.
          </li>
        </ul>
      </details>
    </div>
  );
}
