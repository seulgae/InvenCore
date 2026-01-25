import React, { useState, useEffect } from 'react';
import '../styles/MainPage.css';
import LoginPage from './LoginPage';
import JoinPage from './JoinPage';

function MainPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // ✅ 사이드바 토글 상태
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const storedUsername = localStorage.getItem('username');

        if (accessToken && storedUsername) {
            setIsLoggedIn(true);
            setUsername(storedUsername);
        }
    }, []);

    // ✅ 사이드바 열려있을 때 스크롤 잠금(모바일 UX)
    useEffect(() => {
        if (isSidebarOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isSidebarOpen]);

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

    const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="page-wrapper">
            <nav className="navbar">
                <div className="navbar-left">
                    {/* ✅ 햄버거 버튼 */}
                    <button
                        className="menu-button"
                        onClick={toggleSidebar}
                        aria-label="메뉴 열기"
                        aria-expanded={isSidebarOpen}
                    >
                        {/* 아이콘은 CSS로 그릴거라 span 3개 */}
                        <span />
                        <span />
                        <span />
                    </button>

                    <div className="navbar-logo">
                        <a href="/">
                            <span>InvenCore</span>
                        </a>
                    </div>
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

            {/* ✅ 오버레이: 사이드바 열렸을 때만 표시, 클릭하면 닫힘 */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
                aria-hidden={!isSidebarOpen}
            />

            <div className="main-page-container">
                {/* ✅ sidebar: hover 제거하고 open 상태로 제어 */}
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <ul>
                        <li><a href="#" onClick={closeSidebar}>SpringBoot</a></li>
                        <li><a href="#" onClick={closeSidebar}>Kafka</a></li>
                        <li><a href="#" onClick={closeSidebar}>RDBMS</a></li>
                        <li><a href="#" onClick={closeSidebar}>Java</a></li>
                    </ul>
                </aside>

                {/* ✅ main-content: 사이드바 열리면 밀리도록 클래스 */}
                <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                    <h1>안녕하세요 사이트의 메인 페이지 입니다.</h1>
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
