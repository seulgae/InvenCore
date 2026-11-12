import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import BreakRoomDialog from "../components/inventory/BreakRoomDialog";
import { inventory } from "../data/inventory";
import "../styles/Inventory.css";

/** 카테고리와 검색 조건에 맞는 기술 인벤토리 카드를 표시합니다. */
export default function InventoryPage() {
  const [breakRoomOpen, setBreakRoomOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "All";
  const query = params.get("q") || "";
  const sort = params.get("sort") || "number";

  /** 검색·카테고리 조건을 URL에 반영합니다. */
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
      sort === "title" ? a.title.localeCompare(b.title, "ko") : a.number.localeCompare(b.number),
    );
  return (
    <div className="inventory-workspace">
      {breakRoomOpen && <BreakRoomDialog onClose={() => setBreakRoomOpen(false)} />}
      <section className="inventory-main" aria-labelledby="inventory-title">
        <header className="workspace-heading">
          <div>
            <h1 id="inventory-title">
              기술 인벤토리
              <span>{inventory.length.toString().padStart(2, "0")}</span>
            </h1>
          </div>
          <button
            className="break-room-entry"
            onClick={() => setBreakRoomOpen(true)}
            aria-haspopup="dialog"
          >
            <i aria-hidden="true" />
            하기 싫을 때 ↗
          </button>
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
            <select value={sort} onChange={(event) => update("sort", event.target.value)}>
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
                <span>{item.kind === "guide" ? "▤ GUIDE" : "▷ RUN"}</span>
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
      </section>
    </div>
  );
}
