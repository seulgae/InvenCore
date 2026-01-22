import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/MainPage.css';
import LoginPage from './LoginPage';
import JoinPage from './JoinPage';
// import logo from '../assets/react.svg'; // 로고 이미지 임포트 제거

function MainPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const storedUsername = localStorage.getItem('username');

    if (accessToken && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    window.location.reload();
  };

  const handleLoginSuccess = (loggedInUsername) => {
    setIsLoggedIn(true);
    setUsername(loggedInUsername);
    setShowLoginModal(false);
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    setShowLoginModal(true);
  };

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="navbar-logo">
          {/* public 폴더의 이미지는 절대 경로로 참조 */}
          <img src="/logo.svg" alt="InvenCore Logo" /> {/* .png에서 .svg로 변경 */}
          <span>InvenCore</span>
        </div>
        <div className="navbar-auth">
          {isLoggedIn ? (
            <>
              <span className="navbar-welcome">{username}님 안녕하세요.</span>
              <button onClick={handleLogout} className="nav-button">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setShowLoginModal(true)} className="nav-button">
                로그인
              </button>
              <button onClick={() => setShowJoinModal(true)} className="nav-button">
                회원가입
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="main-page-container">
        <div className="sidebar">
          <h3>메뉴</h3>
          <ul>
            <li><Link to="/items">상품 관리</Link></li>
            <li><Link to="/items/new">상품 등록</Link></li>
            <li><a href="#">메뉴 항목 2</a></li>
            <li><a href="#">메뉴 항목 3</a></li>
          </ul>
        </div>

        <div className="main-content">
          <h1>안녕하세요 슬기로운 개발자 슬개 입니다.</h1>
          <p>This is your new main page component.</p>
        </div>
      </div>

      {showLoginModal && (
        <LoginPage
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {showJoinModal && (
        <JoinPage
          onClose={() => setShowJoinModal(false)}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
}

export default MainPage;