import { useEffect, useRef, useState } from "react";
import apiClient from "../../api/axios";
import "../../styles/ServerCapacity.css";

const bytes = (value) => `${(value / 1024 ** 3).toFixed(2)} GiB`;
const percent = (used, total) => ((100 * used) / total).toFixed(1);

function ResourceCard({ icon, title, value, detail, usage, footer }) {
  return (
    <article className="capacity-resource">
      <div className="capacity-resource-heading">
        <span aria-hidden="true">{icon}</span>
        <h2>{title}</h2>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
      <meter min="0" max="100" value={usage} aria-label={`${title} 사용률`} />
      <small>{footer}</small>
    </article>
  );
}

/** 버튼 요청마다 Ubuntu 호스트에 직접 측정을 요청하고 응답을 표시합니다. */
export default function ServerCapacityPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef(null);

  useEffect(() => () => pending.current?.abort(), []);

  /** 이전 결과 파일 조회가 아니라, 현재 요청에서 새로 측정합니다. */
  const refresh = async () => {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get("/server-capacity/host", { signal: controller.signal });
      if (!controller.signal.aborted) setSnapshot(data);
    } catch (failure) {
      if (!controller.signal.aborted) {
        const status = failure.response?.status;
        setError(
          status === 401
            ? "로그인 후 서버 사용량을 조회할 수 있습니다."
            : status === 404
              ? "호스트 조회 API가 활성화되어 있지 않습니다. 서버 설정을 확인해 주세요."
              : failure.response?.data?.message ||
                "Ubuntu 실시간 조회에 실패했습니다. 호스트 조회 서비스 연결을 확인해 주세요.",
        );
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (pending.current === controller) pending.current = null;
    }
  };

  return (
    <section className="capacity-container" aria-busy={loading}>
      <header className="capacity-header">
        <div>
          <span className="capacity-eyebrow">UBUNTU HOST / LIVE METRICS</span>
          <h1>서버 용량 조사</h1>
          <p>InvenCore가 실행되는 Ubuntu 서버 전체의 사용량을 확인합니다.</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading}>
          {loading ? "Ubuntu 측정 중…" : "↻ 지금 조회"}
        </button>
      </header>
      <div className="capacity-status">
        <span role="status">
          {loading
            ? "● 호스트에 직접 조회 중"
            : error
              ? "● 조회 실패"
              : snapshot
                ? "● 요청 시점 측정 완료"
                : "● 조회 대기 중"}
        </span>
        <span>버튼을 누를 때 새로 측정 · CPU 측정 약 0.5초</span>
      </div>
      {error && (
        <div className="capacity-error" role="alert">
          {error}
          {snapshot && " 아래 값은 마지막으로 조회한 결과입니다."}
        </div>
      )}
      {snapshot ? (
        <>
          <div className="capacity-resources">
            <ResourceCard
              icon="◫"
              title="CPU"
              value={`${snapshot.cpuUsage.toFixed(1)}%`}
              detail={`논리 CPU ${snapshot.logicalCpuCount}개 전체 기준`}
              usage={snapshot.cpuUsage}
              footer="0.5초 동안의 CPU 시간 변화량으로 측정"
            />
            <ResourceCard
              icon="▤"
              title="메모리"
              value={`${percent(snapshot.memoryUsedBytes, snapshot.memoryTotalBytes)}%`}
              detail={`${bytes(snapshot.memoryUsedBytes)} 사용 / ${bytes(snapshot.memoryTotalBytes)} 전체`}
              usage={percent(snapshot.memoryUsedBytes, snapshot.memoryTotalBytes)}
              footer={`사용 가능 ${bytes(snapshot.memoryAvailableBytes)} · 회수 가능한 캐시 반영`}
            />
            <ResourceCard
              icon="▰"
              title="디스크 /"
              value={`${percent(snapshot.diskUsedBytes, snapshot.diskTotalBytes)}%`}
              detail={`${bytes(snapshot.diskUsedBytes)} 사용 / ${bytes(snapshot.diskTotalBytes)} 전체`}
              usage={percent(snapshot.diskUsedBytes, snapshot.diskTotalBytes)}
              footer={`일반 사용자 사용 가능 ${bytes(snapshot.diskAvailableBytes)} · 예약 공간 제외`}
            />
          </div>
          <p className="capacity-timestamp">
            측정 시각{" "}
            <time dateTime={snapshot.measuredAt}>
              {new Date(snapshot.measuredAt).toLocaleString("ko-KR")}
            </time>
          </p>
        </>
      ) : (
        !loading && (
          <div className="capacity-empty">
            ‘지금 조회’를 누르면 Ubuntu 서버에 요청을 보내 현재 사용량을 측정합니다.
          </div>
        )
      )}
      <aside className="capacity-scope">
        <strong>조회 범위</strong>
        <p>
          Hyper-V에 할당된 Ubuntu VM 전체입니다. 백엔드 컨테이너의 768MB 제한이나 Windows PC 전체
          용량이 아닙니다. 디스크는 Ubuntu의 루트 파일시스템(/) 기준이며, 다른 마운트의 디스크는
          포함하지 않습니다.
        </p>
      </aside>
    </section>
  );
}
