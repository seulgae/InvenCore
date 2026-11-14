import { Link, useSearchParams } from "react-router-dom";
import { inventory, categories } from "../data/inventory";
import "../styles/Inventory.css";

function SystemSketch() {
  return (
    <div className="system-sketch" aria-label="API, 이벤트, 캐시, 데이터베이스를 연결한 백엔드 구성 개념도">
      <div className="sketch-top"><span><i /> SYSTEM PLAYGROUND</span><span>01 — 04</span></div>
      <div className="sketch-stage" aria-hidden="true">
        <svg className="sketch-lines" viewBox="0 0 460 270" fill="none">
          <path d="M230 73 V132 M90 132 H370 M90 132 V184 M230 132 V184 M370 132 V184" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="230" cy="132" r="4" fill="currentColor" />
        </svg>
        <div className="sketch-api"><span>↗</span><div><small>ENTRY POINT</small><strong>Spring Boot API</strong></div><i /></div>
        <div className="sketch-service sketch-service--event"><span>≋</span><strong>Kafka</strong><small>EVENT</small></div>
        <div className="sketch-service sketch-service--cache"><span>ϟ</span><strong>Redis</strong><small>CACHE</small></div>
        <div className="sketch-service sketch-service--db"><span>▱</span><strong>PostgreSQL</strong><small>DATA</small></div>
      </div>
      <div className="sketch-bottom"><span>한 번의 요청, 연결되는 기술들</span><span>EXPLORE THE CORE ↗</span></div>
    </div>
  );
}

export default function InventoryPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "All";
  const query = params.get("q") || "";
  const sort = params.get("sort") || "number";
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== "All") next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const items = inventory.filter(item => (category === "All" || item.category === category) && `${item.title} ${item.subtitle} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "ko") : a.number.localeCompare(b.number));
  return (
    <div className="lab-home">
      <section className="lab-hero" aria-labelledby="lab-title">
        <div className="lab-hero-copy">
          <span className="lab-eyebrow"><i /> THE BACKEND PLAYGROUND</span>
          <h1 id="lab-title">코드 너머의 원리,<br /><em>실행하며 이해하다.</em></h1>
          <p>이벤트가 흐르고, 데이터가 쌓이고, 응답이 빨라지는 과정.<br className="desktop-break" /> 직접 만든 기능을 실행하며 백엔드의 작동 원리를 탐색합니다.</p>
          <div className="lab-hero-actions"><a className="lab-primary" href="#modules">실험 둘러보기 <span>↗</span></a></div>
          <div className="lab-hero-meta"><span><b>{String(inventory.length).padStart(2, "0")}</b> 탐색할 모듈</span><span><b>03</b> 접근 방식 <small>구현 · 실행 · 구조</small></span></div>
        </div>
        <SystemSketch />
      </section>
      <section id="modules" className="lab-modules" aria-labelledby="modules-title">
        <header className="lab-section-header"><div><span className="lab-eyebrow">EXPLORE THE INVENTORY</span><h2 id="modules-title">작동하는 기술, 하나씩.</h2><p>궁금한 모듈을 선택해 구현부터 실행까지 살펴보세요.</p></div><span className="lab-module-count">{String(inventory.length).padStart(2, "0")} MODULES</span></header>
        <div className="lab-filters">
          <nav className="lab-category-tabs" aria-label="모듈 카테고리">{categories.map(entry => <button key={entry} aria-pressed={category === entry} onClick={() => update("category", entry)}>{entry === "All" ? "전체" : entry}{entry === "All" && <small>{inventory.length}</small>}</button>)}</nav>
          <div className="lab-search-tools"><label className="lab-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input type="search" aria-label="모듈 검색" placeholder="기술이나 모듈 검색" value={query} onChange={event => update("q", event.target.value)} /></label><label className="lab-sort"><span className="sr-only">정렬</span><select value={sort} onChange={event => update("sort", event.target.value)}><option value="number">기본순</option><option value="title">이름순</option></select></label></div>
        </div>
        <div className="lab-results" role="status"><span>{category === "All" ? "전체 모듈" : category} <b>{items.length}</b></span><span>IMPLEMENTATION / SOURCE / ARCHITECTURE</span></div>
        <div className="lab-module-grid">
          {items.map(item => <article className={`lab-module item-${item.color}`} key={item.id}>
            <Link to={`/inventory/${item.id}`} className="lab-module-link">
              <div className="lab-card-top"><span className="lab-card-number">MODULE {item.number}</span><span className="lab-card-kind">{item.kind === "guide" ? "GUIDE" : "HANDS-ON"}</span></div>
              <div className="lab-card-symbol" aria-hidden="true">{item.icon}<span>↗</span></div>
              <span className="lab-card-category">{item.category}</span><h3>{item.title}</h3><p>{item.summary}</p>
              <div className="lab-card-tags">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
              <div className="lab-card-bottom"><span>{item.kind === "guide" ? "가이드 살펴보기" : "모듈 탐색하기"}</span><span aria-hidden="true">↗</span></div>
            </Link>
          </article>)}
        </div>
        {items.length === 0 && <div className="lab-empty"><span>⌕</span><h3>일치하는 모듈이 없습니다.</h3><p>검색어나 카테고리를 바꿔 다시 찾아보세요.</p><button onClick={() => setParams({})}>전체 모듈 보기</button></div>}
      </section>
      <section className="lab-bottom-note"><span aria-hidden="true">{ "{ }" }</span><div><h2>읽는 데서 멈추지 않는 기술 기록.</h2><p>구현 의도와 실제 코드, 동작하는 데모를 한곳에서 연결합니다.</p></div><a href="#modules" aria-label="모듈 목록으로 돌아가기">↑</a></section>
    </div>
  );
}
