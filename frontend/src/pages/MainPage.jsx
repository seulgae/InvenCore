import { useEffect, useState } from "react";
import { Link, Outlet, useSearchParams, useLocation } from "react-router-dom";
import { inventory, categories } from "../data/inventory";
import "../styles/MainPage.css";
import LoginPage from "./auth/LoginPage";
import JoinPage from "./auth/JoinPage";
import { logout } from "../services/authService";

function readSession() {
  return {
    username: sessionStorage.getItem("username"),
    role: Number(sessionStorage.getItem("role")),
    token: sessionStorage.getItem("accessToken"),
  };
}

export default function MainPage() {
  const [session, setSession] = useState(readSession);
  const [modal, setModal] = useState(null);
  const [projectOpen, setProjectOpen] = useState(
    () => window.matchMedia("(min-width: 651px)").matches,
  );
  const location = useLocation();
  const currentItem = inventory.find(
    (item) => location.pathname === `/inventory/${item.id}`,
  );
  const currentView =
    new URLSearchParams(location.search).get("tab") || "overview";
  const activeItem = currentItem || inventory[0];
  const [searchParams, setSearchParams] = useSearchParams();
  const isLoggedIn = Boolean(session.token);
  const loginRequested = searchParams.get("auth") === "login";
  useEffect(() => {
    const requireLogin = () => {
      setSession(readSession());
      setModal("login");
    };
    window.addEventListener("invencore:authentication-required", requireLogin);
    return () =>
      window.removeEventListener(
        "invencore:authentication-required",
        requireLogin,
      );
  }, []);
  const closeModal = () => {
    setModal(null);
    if (loginRequested) {
      const next = new URLSearchParams(searchParams);
      next.delete("auth");
      setSearchParams(next, { replace: true });
    }
  };
  const handleLogout = () => {
    logout();
    setSession(readSession());
  };
  return (
    <div className="page-wrapper">
      <a className="skip-link" href="#main-content">
        본문으로 이동
      </a>
      <header className="navbar">
        <Link className="site-brand" to="/" aria-label="InvenCore 홈">
          <span className="brand-symbol">
            ic<span>.</span>
          </span>
          <span className="brand-mark brand-mark--nav">
            inven<strong>core</strong>
          </span>
        </Link>
        <span className="ide-project-label">
          InvenCore <span>⌄</span>
        </span>
        <span className="ide-branch">⑂ main</span>
        <Link
          className="ide-run-configuration"
          to={`/inventory/${activeItem.id}?tab=demo`}
        >
          <span>▶</span> {activeItem.title} 실행
        </Link>
        <div className="navbar-auth">
          {isLoggedIn ? (
            <>
              <span className="navbar-welcome">{session.username}님</span>
              <button className="nav-button" onClick={handleLogout}>
                로그아웃 ↗
              </button>
            </>
          ) : (
            <>
              <button className="nav-button" onClick={() => setModal("login")}>
                로그인
              </button>
              <button
                className="nav-button nav-button-primary"
                onClick={() => setModal("join")}
              >
                회원가입 <span>↗</span>
              </button>
            </>
          )}
        </div>
      </header>
      <div className={`ide-workbench ${projectOpen ? "" : "project-hidden"}`}>
        <nav className="ide-tool-rail" aria-label="도구 창">
          <button
            title="프로젝트 트리 표시"
            aria-label="프로젝트 트리 표시"
            aria-pressed={projectOpen}
            onClick={() => setProjectOpen(!projectOpen)}
          >
            ▤
          </button>
          <Link to="/" title="인벤토리" aria-label="인벤토리">
            ▦
          </Link>
          <Link
            to={`/inventory/${activeItem.id}?tab=source`}
            title="소스 탐색기"
            aria-label="소스 탐색기"
          >
            〈〉
          </Link>
          <Link
            to={`/inventory/${activeItem.id}?tab=architecture`}
            title="아키텍처"
            aria-label="아키텍처"
          >
            ⌗
          </Link>
          <Link
            className="ide-rail-bottom"
            to={`/inventory/${activeItem.id}?tab=demo`}
            title="실행 창"
            aria-label="실행 창"
          >
            ▷
          </Link>
        </nav>
        {projectOpen && (
          <aside
            className="ide-project-tree"
            aria-label="프로젝트 탐색기"
            onClick={(event) => {
              if (
                window.matchMedia("(max-width: 650px)").matches &&
                event.target.closest("a")
              )
                setProjectOpen(false);
            }}
          >
            <header>
              <strong>Project</strong>
              <button
                aria-label="프로젝트 트리 닫기"
                onClick={() => setProjectOpen(false)}
              >
                −
              </button>
            </header>
            <div className="ide-project-root">
              ⌄ <span>▣</span> InvenCore
            </div>
            <Link
              className={`ide-tree-home ${location.pathname === "/" && !searchParams.get("category") ? "selected" : ""}`}
              to="/"
            >
              ▦ 기술 인벤토리 <small>{inventory.length}</small>
            </Link>
            {categories
              .filter((category) => category !== "All")
              .map((category) => (
                <details key={category} open className="ide-tree-group">
                  <summary>▱ {category}</summary>
                  {inventory
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <Link
                        key={item.id}
                        className={
                          currentItem?.id === item.id ? "selected" : ""
                        }
                        to={`/inventory/${item.id}`}
                      >
                        <span className={`ide-file-icon item-${item.color}`}>
                          {item.icon}
                        </span>
                        {item.title}
                      </Link>
                    ))}
                  <Link
                    className="ide-category-link"
                    to={`/?category=${category}`}
                  >
                    이 영역의 카드 보기 ↗
                  </Link>
                </details>
              ))}
            <div className="ide-tree-section-label">PROJECT STACK</div>
            <div className="ide-tree-stack">
              Java 17 · Spring Boot
              <br />
              React · Vite · JPA
            </div>
          </aside>
        )}
        <div className="ide-editor-area">
          <nav className="ide-editor-tabs" aria-label="열린 화면">
            <Link className={location.pathname === "/" ? "active" : ""} to="/">
              <span>▦</span> 기술 인벤토리
            </Link>
            {currentItem && (
              <div className="ide-open-tab active">
                <Link to={`/inventory/${currentItem.id}`}>
                  <span className={`ide-file-icon item-${currentItem.color}`}>
                    {currentItem.icon}
                  </span>
                  {currentItem.title}
                </Link>
                <Link
                  className="ide-close-tab"
                  to="/"
                  aria-label={`${currentItem.title} 화면 닫기`}
                >
                  ×
                </Link>
              </div>
            )}
          </nav>
          <div className="ide-path-bar">
            <span>InvenCore</span>
            <span>›</span>
            <span>inventory</span>
            {currentItem && (
              <>
                <span>›</span>
                <span>{currentItem.category}</span>
                <span>›</span>
                <strong>{currentItem.title}</strong>
              </>
            )}
            {!currentItem && (
              <>
                <span>›</span>
                <strong>
                  {location.pathname === "/" ? "Overview" : "실행 화면"}
                </strong>
              </>
            )}
          </div>
          <main id="main-content" className="main-content">
            <Outlet
              context={{
                isLoggedIn,
                userRole: session.role,
                openLoginModal: () => setModal("login"),
                openJoinModal: () => setModal("join"),
                refreshSession: () => setSession(readSession()),
              }}
            />
          </main>
          <nav className="ide-bottom-tools" aria-label="구현 도구">
            <Link to={`/inventory/${activeItem.id}?tab=demo`}>▷ 실행</Link>
            <Link to={`/inventory/${activeItem.id}?tab=source`}>
              〈〉 소스 코드
            </Link>
            <Link to={`/inventory/${activeItem.id}?tab=reference`}>
              ▤ 클래스 · 의존성
            </Link>
            <span>{currentItem ? currentView.toUpperCase() : "INVENTORY"}</span>
          </nav>
        </div>
      </div>
      <footer className="site-footer">
        <span className="ide-status-project">▣ InvenCore</span>
        <span>기능 · 소스 · 아키텍처</span>
        <span className="ide-status-right">
          UTF-8 <span>Java 17</span> <span>React</span>
        </span>
      </footer>
      {(modal === "login" || (!modal && loginRequested)) && (
        <LoginPage
          onClose={closeModal}
          onLoginSuccess={() => {
            setSession(readSession());
            closeModal();
          }}
        />
      )}
      {modal === "join" && (
        <JoinPage
          onClose={closeModal}
          onJoinSuccess={() => setModal("login")}
        />
      )}
    </div>
  );
}
