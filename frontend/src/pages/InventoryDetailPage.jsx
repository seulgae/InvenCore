import { Link, useParams, useSearchParams } from "react-router-dom";
import { inventory } from "../data/inventory";
import { architectures } from "../data/architectures";
import ArchitectureView from "../components/inventory/ArchitectureView";
import SourceViewer from "../components/inventory/SourceViewer";
import ImplementationNotes from "../components/inventory/ImplementationNotes";
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

/** 선택한 카드의 노트·실행·소스·구조도 탭을 구성합니다. */
export default function InventoryDetailPage() {
  const { itemId } = useParams();
  const [params, setParams] = useSearchParams();
  const item = inventory.find((entry) => entry.id === itemId);
  const active = tabs.some((tab) => tab.id === params.get("tab")) ? params.get("tab") : "overview";

  /** 현재 탭을 URL에 반영해 탭을 전환합니다. */
  const selectTab = (id) => setParams(id === "overview" ? {} : { tab: id }, { replace: true });
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
          {item.kind === "guide" ? "▤ 배포 가이드 열기" : "▷ 실행 · 구현 실습"}
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
            {item.kind === "guide" && tab.id === "demo"
              ? "배포 가이드"
              : item.kind === "guide" && tab.id === "reference"
                ? "도구·설정·스크립트"
                : tab.label}
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
          <ImplementationNotes
            item={item}
            onTab={selectTab}
            onSource={(index) =>
              setParams({ tab: "source", file: String(index) }, { replace: true })
            }
          />
        )}
      </section>
      <footer className="inspector-footer">
        <span>INVENCORE / {item.id.toUpperCase()}</span>
        <span>
          {item.sources.length} SOURCE FILES · {architectures[item.id].nodes.length} ARCHITECTURE
          NODES
        </span>
        <Link to="/">아이템 목록 ↗</Link>
      </footer>
    </div>
  );
}
