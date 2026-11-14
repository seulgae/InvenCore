import { useEffect, useState } from "react";
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

/** Ubuntu 호스트 수집 결과를 읽습니다. 컨테이너 내부 수치로 대체하지 않습니다. */
export default function ServerCapacityPage() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [automatic, setAutomatic] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    let active = true;
    const refresh = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get("/server-capacity/host", {
          signal: controller.signal,
        });
        if (active) {
          setSnapshot(data);
          setError("");
        }
      } catch (failure) {
        if (active && failure.code !== "ERR_CANCELED") {
          const status = failure.response?.status;
          setError(
            status === 401
              ? "로그인 후 서버 사용량을 확인할 수 있습니다."
              : status === 404
                ? "호스트 모니터링 API가 활성화되어 있지 않습니다. 서버 설정을 확인해 주세요."
                : failure.response?.data?.message ||
                  "Ubuntu 사용량을 불러오지 못했습니다. 수집기와 서버 연결을 확인해 주세요.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          if (automatic) timer = setTimeout(refresh, 10000);
        }
      }
    };
    refresh();
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [automatic, revision]);

  return (
    <section className="capacity-container" aria-busy={loading}>
      <header className="capacity-header">
        <div>
          <span className="capacity-eyebrow">UBUNTU HOST / LIVE METRICS</span>
          <h1>서버 용량 조사</h1>
          <p>InvenCore가 실행되는 Ubuntu 서버 전체의 사용량을 확인합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => setRevision((current) => current + 1)}
          disabled={loading}
        >
          {loading ? "조회 중…" : "↻ 새로고침"}
        </button>
      </header>
      <div className="capacity-status">
        <span role="status">
          {error ? "● 연결 확인 필요" : snapshot ? "● 호스트 수집 연결됨" : "● 연결 확인 중"}
        </span>
        <label>
          <input
            type="checkbox"
            checked={automatic}
            onChange={(event) => setAutomatic(event.target.checked)}
          />
          10초마다 새로고침
        </label>
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
            수집 시각{" "}
            <time dateTime={snapshot.measuredAt}>
              {new Date(snapshot.measuredAt).toLocaleString("ko-KR")}
            </time>
          </p>
        </>
      ) : (
        !loading && (
          <div className="capacity-empty">
            아직 수집 결과가 없습니다. Ubuntu 호스트 수집기를 연결하면 실제 사용량이 표시됩니다.
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
