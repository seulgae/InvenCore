import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom'; // ✅ Outlet 임포트
import '../styles/MainPage.css';
import LoginPage from './LoginPage';
import JoinPage from './JoinPage';

function MainPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const storedUsername = localStorage.getItem('username');

        if (accessToken && storedUsername) {
            setIsLoggedIn(true);
            setUsername(storedUsername);
        }
    }, []);

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
                    <button
                        className="menu-button"
                        onClick={toggleSidebar}
                        aria-label="메뉴 열기"
                        aria-expanded={isSidebarOpen}
                    >
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

            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
                aria-hidden={!isSidebarOpen}
            />

            <div className="main-page-container">
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <ul>
                        <li><Link to="/board" onClick={closeSidebar}>요청 게시판</Link></li>
                    </ul>
                </aside>

                <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                    {/* ✅ Outlet에 context로 필요한 값들을 전달 */}
                    <Outlet context={{ 
                        isLoggedIn, 
                        openLoginModal: () => setShowLoginModal(true),
                        openJoinModal: () => setShowJoinModal(true) 
                    }} />
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