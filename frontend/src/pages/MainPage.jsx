import { useEffect, useState } from "react";
import { Link, Outlet, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const isLoggedIn = Boolean(session.token);
  const loginRequested = searchParams.get("auth") === "login";
  useEffect(() => {
    const requireLogin = () => {
      setSession(readSession());
      setModal("login");
    };
    window.addEventListener("invencore:authentication-required", requireLogin);
    return () => window.removeEventListener("invencore:authentication-required", requireLogin);
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
            <small>PERSONAL TECH INVENTORY</small>
          </span>
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
      <footer className="site-footer">
        <Link to="/">
          invencore<span>.</span>
        </Link>
        <p>TECH INVENTORY / SOURCE ARCHIVE</p>
        <span>BUILT WITH JAVA & REACT</span>
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
