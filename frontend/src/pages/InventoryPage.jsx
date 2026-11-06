import { Link, useSearchParams } from "react-router-dom";
import { categories, inventory } from "../data/inventory";
import "../styles/Inventory.css";

export default function InventoryPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "All";
  const query = params.get("q") || "";
  const sort = params.get("sort") || "number";
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const items = inventory
    .filter(
      (item) =>
        (category === "All" || item.category === category) &&
        `${item.title} ${item.subtitle} ${item.tags.join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "title"
        ? a.title.localeCompare(b.title, "ko")
        : a.number.localeCompare(b.number),
    );
  return (
    <div className="inventory-workspace">
      <aside className="inventory-rail" aria-label="인벤토리 분류">
        <div className="rail-heading">
          <span className="rail-icon">▦</span>
          <span>
            WORKSPACE<small>InvenCore / 개인 보관함</small>
          </span>
        </div>
        <p className="rail-label">COLLECTIONS</p>
        {categories.map((name, index) => (
          <button
            key={name}
            className={`rail-category ${category === name ? "active" : ""}`}
            aria-pressed={category === name}
            onClick={() => update("category", name === "All" ? "" : name)}
          >
            <span className="rail-category-icon">
              {["▦", ">_", "◈", "{ }"][index]}
            </span>
            {name === "All" ? "모든 아이템" : name}
            <small>
              {inventory
                .filter((item) => name === "All" || item.category === name)
                .length.toString()
                .padStart(2, "0")}
            </small>
          </button>
        ))}
        <div className="rail-divider" />
        <p className="rail-label">CONTENTS / ITEM</p>
        <div className="rail-content">
          <span>▷</span> 실행 화면
        </div>
        <div className="rail-content">
          <span>⌘</span> 소스 코드
        </div>
        <div className="rail-content">
          <span>⌗</span> 아키텍처
        </div>
        <div className="rail-content">
          <span>≡</span> 구현 노트
        </div>
        <div className="rail-bottom">
          <span className="tiny-status" />
          LOCAL COLLECTION<small>Java 17 · React · Spring Boot</small>
        </div>
      </aside>
      <section className="inventory-main" aria-labelledby="inventory-title">
        <div className="workspace-breadcrumb">
          WORKSPACE <span>/</span> INVENTORY <span>/</span>{" "}
          {category.toUpperCase()}
        </div>
        <header className="workspace-heading">
          <div>
            <p className="workspace-kicker">PERSONAL TECH STORAGE</p>
            <h1 id="inventory-title">
              기술 인벤토리
              <span>{inventory.length.toString().padStart(2, "0")}</span>
            </h1>
          </div>
          <div className="collection-meta">
            <span className="tiny-status" /> IMPLEMENTATION ARCHIVE
            <small>기능 · 코드 · 구조</small>
          </div>
        </header>
        <div className="inventory-controls">
          <label className="workspace-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="인벤토리 검색"
              placeholder="아이템, 기술, 키워드 검색..."
              value={query}
              onChange={(event) => update("q", event.target.value)}
            />
          </label>
          <label className="inventory-sort">
            <span className="sr-only">정렬</span>
            <select
              value={sort}
              onChange={(event) => update("sort", event.target.value)}
            >
              <option value="number">등록 순서</option>
              <option value="title">이름 순서</option>
            </select>
          </label>
          <span className="grid-view-indicator" aria-label="카드 보기">
            ▦
          </span>
        </div>
        <div className="inventory-grid-label">
          <span>
            {category === "All" ? "ALL ITEMS" : category.toUpperCase()}{" "}
            <b>/ {items.length.toString().padStart(2, "0")}</b>
          </span>
          <span>SELECT AN ITEM TO INSPECT ↙</span>
        </div>
        <div className="item-slot-grid">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/inventory/${item.id}`}
              className={`inventory-item item-${item.color}`}
              aria-label={`${item.title} 열기`}
            >
              <div className="item-topline">
                <span>IC — {item.number}</span>
                <span>{item.category.toUpperCase()}</span>
              </div>
              <div className="item-object">
                <div className="object-grid" />
                <span>{item.icon}</span>
                <small>{item.subtitle}</small>
                <span className="item-object-corner">↗</span>
              </div>
              <div className="item-card-body">
                <h2>
                  {item.title}
                  <span>↗</span>
                </h2>
                <p>{item.summary}</p>
                <div className="item-tag-list">
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="item-card-footer">
                <span>▷ RUN</span>
                <span>⌘ {item.sources.length} FILES</span>
                <span>⌗ STRUCTURE</span>
              </div>
            </Link>
          ))}
        </div>
        {items.length === 0 && (
          <div className="empty-inventory" role="status">
            <span>∅</span>
            <h2>일치하는 아이템 없음</h2>
            <button onClick={() => setParams({})}>필터 초기화</button>
          </div>
        )}
        <div className="inventory-statusbar">
          <span>
            {items.length} / {inventory.length} ITEMS
          </span>
          <span>INVENCORE / TECH INVENTORY</span>
          <span>▦ GRID VIEW</span>
        </div>
      </section>
    </div>
  );
}
