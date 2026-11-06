import { Link, useParams, useSearchParams } from "react-router-dom";
import { inventory, displayPath } from "../data/inventory";
import ArchitectureView from "../components/inventory/ArchitectureView";
import SourceViewer from "../components/inventory/SourceViewer";
import FeatureDemo from "../components/inventory/FeatureDemo";
import ImplementationReference from "../components/inventory/ImplementationReference";
import "../styles/Inventory.css";

const tabs = [
  { id: "overview", label: "구현 노트", icon: "≡" },
  { id: "demo", label: "실행", icon: "▷" },
  { id: "source", label: "소스 코드", icon: "⌘" },
  { id: "architecture", label: "아키텍처", icon: "⌗" },
  { id: "reference", label: "클래스·메서드·라이브러리", icon: "{ }" },
];
export default function InventoryDetailPage() {
  const { itemId } = useParams();
  const [params, setParams] = useSearchParams();
  const item = inventory.find((entry) => entry.id === itemId);
  const active = tabs.some((tab) => tab.id === params.get("tab"))
    ? params.get("tab")
    : "overview";
  const selectTab = (id) =>
    setParams(id === "overview" ? {} : { tab: id }, { replace: true });
  if (!item)
    return (
      <div className="empty-inventory">
        <h1>아이템을 찾을 수 없습니다.</h1>
        <Link to="/">인벤토리로 돌아가기</Link>
      </div>
    );
  return (
    <div className={`item-inspector item-${item.color}`}>
      <div className="inspector-breadcrumb">
        <Link to="/">← 인벤토리</Link>
        <span>/</span>
        <span>{item.category}</span>
        <span>/</span>
        <span>IC—{item.number}</span>
      </div>
      <header className="inspector-heading">
        <span className="inspector-icon">{item.icon}</span>
        <div>
          <p>{item.subtitle}</p>
          <h1>{item.title}</h1>
          <div className="item-tag-list">
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <button className="inspector-run" onClick={() => selectTab("demo")}>
          ▷ 실행하기
        </button>
      </header>
      <nav className="inspector-tabs" aria-label="아이템 보기">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            aria-current={active === tab.id ? "page" : undefined}
            className={active === tab.id ? "active" : ""}
            onClick={() => selectTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.id === "source" && <small>{item.sources.length}</small>}
          </button>
        ))}
        <code>ITEM / {item.number}</code>
      </nav>
      <section
        className="inspector-panel"
        aria-labelledby={`tab-${active}`}
        key={`${item.id}-${active}`}
      >
        {active === "source" && <SourceViewer item={item} />}
        {active === "architecture" && <ArchitectureView item={item} />}
        {active === "demo" && <FeatureDemo item={item} />}
        {active === "reference" && <ImplementationReference item={item} />}
        {active === "overview" && (
          <div className="implementation-overview">
            <section className="implementation-description">
              <div className="inspector-section-label">01 / IMPLEMENTATION</div>
              <h2>{item.summary}</h2>
              <p>{item.description}</p>
              <ul>
                {item.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div className="endpoint-strip">
                <span>ENTRY POINT</span>
                <code>{item.endpoint}</code>
              </div>
            </section>
            <aside className="implementation-files">
              <div className="inspector-section-label">02 / SOURCE FILES</div>
              {item.sources.map((source, index) => (
                <button
                  key={source.path}
                  onClick={() =>
                    setParams(
                      { tab: "source", file: String(index) },
                      { replace: true },
                    )
                  }
                >
                  <span>{displayPath(source.path).split("/").pop()}</span>
                  <small>{String(index + 1).padStart(2, "0")} ↗</small>
                </button>
              ))}
              <p>
                현재 프로젝트의 실제 구현 파일
                <br />
                선택하면 소스 탐색기가 열립니다.
              </p>
            </aside>
            <section className="overview-architecture">
              <div className="overview-section-heading">
                <div className="inspector-section-label">03 / ARCHITECTURE</div>
                <button onClick={() => selectTab("architecture")}>
                  구조 전체 보기 ↗
                </button>
              </div>
              <ArchitectureView item={item} compact />
            </section>
            <section className="implementation-caveats">
              <button onClick={() => selectTab("reference")}>
                사용 클래스 · 메서드별 로직 · build.gradle 의존성 보기 →
              </button>
              <div className="inspector-section-label">04 / CURRENT LIMITS</div>
              <ul>
                {item.caveats.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </section>
      <footer className="inspector-footer">
        <span>INVENCORE / {item.id.toUpperCase()}</span>
        <span>
          {item.sources.length} SOURCE FILES · {item.steps.length} ARCHITECTURE
          NODES
        </span>
        <Link to="/">아이템 목록 ↗</Link>
      </footer>
    </div>
  );
}
