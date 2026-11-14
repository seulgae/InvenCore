import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useSearchParams, useLocation } from "react-router-dom";
import LoginPage from "./auth/LoginPage";
import JoinPage from "./auth/JoinPage";
import "../styles/MainPage.css";

const readSession = () => ({ role: Number(sessionStorage.getItem("role")), token: sessionStorage.getItem("accessToken") });

export default function MainPage() {
  const [session, setSession] = useState(readSession);
  const [modal, setModal] = useState(null);
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const loginRequested = params.get("auth") === "login";
  useEffect(() => {
    const requireLogin = () => { setSession(readSession()); setModal("login"); };
    window.addEventListener("invencore:authentication-required", requireLogin);
    return () => window.removeEventListener("invencore:authentication-required", requireLogin);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname]);
  const closeModal = () => {
    setModal(null);
    if (loginRequested) {
      const next = new URLSearchParams(params);
      next.delete("auth");
      setParams(next, { replace: true });
    }
  };
  return (
    <div className="lab-shell">
      <a className="skip-link" href="#main-content">본문으로 이동</a>
      <header className="lab-header">
        <div className="lab-header-inner">
          <Link className="lab-brand" to="/" aria-label="InvenCore 홈">
            <span className="lab-brand-symbol" aria-hidden="true">ic</span>
            <span>InvenCore<span className="lab-brand-dot">.</span></span>
          </Link>
          <nav className="lab-nav" aria-label="상단 메뉴">
            <NavLink to="/" end>기술 인벤토리</NavLink>
            <NavLink to="/guestbook">방명록</NavLink>
          </nav>
          <span className="lab-header-label"><i /> BUILD. RUN. UNDERSTAND.</span>
        </div>
      </header>
      <main id="main-content" className="lab-main">
        <Outlet context={{
          isLoggedIn: Boolean(session.token),
          userRole: session.role,
          openLoginModal: () => setModal("login"),
          openJoinModal: () => setModal("join"),
          refreshSession: () => setSession(readSession()),
        }} />
      </main>
      <footer className="lab-footer">
        <Link to="/">InvenCore<span>.</span></Link>
        <p>직접 구현하고, 실행으로 확인하는 백엔드 실험실.</p>
        <span className="lab-footer-caption">A WORK IN PROGRESS, ALWAYS.</span>
      </footer>
      {(modal === "login" || (!modal && loginRequested)) && <LoginPage onClose={closeModal} onLoginSuccess={() => { setSession(readSession()); closeModal(); }} />}
      {modal === "join" && <JoinPage onClose={closeModal} onJoinSuccess={() => setModal("login")} />}
    </div>
  );
}
